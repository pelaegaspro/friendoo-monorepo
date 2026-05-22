package com.friendoo.app.presentation.wallet

import androidx.activity.ComponentActivity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cashfree.pg.core.api.callback.CFCheckoutResponseCallback
import com.friendoo.app.BuildConfig
import com.friendoo.app.core.payment.CashfreeManager
import com.friendoo.app.core.payment.CashfreePaymentCallbackRegistry
import com.friendoo.app.data.local.UserPreferences
import com.friendoo.app.data.remote.api.dto.TransactionDto
import com.friendoo.app.data.remote.firebase.FirebaseFunctionsSource
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.Query
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

data class CoinPackage(
    val id: String = "",
    val displayName: String = "",
    val priceInr: Int = 0,
    val coins: Int = 0,
    val bonus: Int = 0
)

data class WalletUiState(
    val balance: Int = 0,
    val totalEarned: Double = 0.0,
    val isUpiVerified: Boolean = false,
    val transactions: List<TransactionDto> = emptyList(),
    val coinPackages: List<CoinPackage> = emptyList(),
    val isLoading: Boolean = false,
    val isCreatingOrder: Boolean = false,
    val isAwaitingCoinCredit: Boolean = false,
    val error: String? = null
) {
    val isProcessingPayment: Boolean get() = isCreatingOrder || isAwaitingCoinCredit
}

@HiltViewModel
class WalletViewModel @Inject constructor(
    private val userPreferences: UserPreferences,
    private val functionsSource: FirebaseFunctionsSource,
    private val cashfreeManager: CashfreeManager,
    private val cashfreeCallbackRegistry: CashfreePaymentCallbackRegistry,
    private val firestore: FirebaseFirestore
) : ViewModel() {

    @Volatile
    private var walletObserving = false

    private val _state = MutableStateFlow(WalletUiState())
    val state: StateFlow<WalletUiState> = _state
    val isHostFlow = userPreferences.isHostFlow

    private var walletListener: ListenerRegistration? = null
    private var packageListener: ListenerRegistration? = null
    private var transactionListener: ListenerRegistration? = null
    private var creditPollJob: Job? = null
    private var cachedUserId: String? = null
    private var balanceAtCheckout: Int = 0
    private var pendingCashfreeOrderId: String? = null

    init {
        viewModelScope.launch {
            userPreferences.userIdFlow.collect { cachedUserId = it }
        }
        observeWalletData()
        observeCoinPackages()
    }

    fun loadWalletData() {
        if (!walletObserving) observeWalletData()
    }

    private fun observeWalletData() {
        if (walletObserving) return
        viewModelScope.launch {
            walletObserving = true
            _state.value = _state.value.copy(isLoading = true)
            val userId = cachedUserId ?: userPreferences.userIdFlow.first()
            if (userId.isNullOrBlank()) {
                _state.value = _state.value.copy(isLoading = false, error = "Please sign in again")
                walletObserving = false
                return@launch
            }

            walletListener?.remove()
            walletListener = firestore.collection("users").document(userId)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        _state.value = _state.value.copy(
                            isLoading = false,
                            error = error.message
                        )
                        return@addSnapshotListener
                    }

                    val previousBalance = _state.value.balance
                    val nextBalance = (snapshot?.getLong("coinBalance")
                        ?: snapshot?.getLong("coins")
                        ?: 0).toInt()

                    _state.value = _state.value.copy(
                        balance = nextBalance,
                        isLoading = false,
                        isAwaitingCoinCredit = if (
                            nextBalance > previousBalance && _state.value.isAwaitingCoinCredit
                        ) {
                            creditPollJob?.cancel()
                            false
                        } else {
                            _state.value.isAwaitingCoinCredit
                        },
                        error = null
                    )
                }

            observeTransactions(userId)
        }
    }

    private fun observeTransactions(userId: String) {
        transactionListener?.remove()
        transactionListener = firestore.collection("coinTransactions")
            .whereEqualTo("userId", userId)
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .limit(20)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    android.util.Log.w("WALLET_DEBUG", "Failed to load transactions", error)
                    return@addSnapshotListener
                }

                val transactions = snapshot?.documents.orEmpty().mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    TransactionDto(
                        type = data["type"] as? String ?: "topup",
                        amount = (data["amountCoins"] as? Number)?.toInt() ?: 0,
                        balanceAfter = (data["balanceAfter"] as? Number)?.toInt() ?: 0,
                        referenceType = "cashfree",
                        referenceId = data["cashfreeOrderId"] as? String ?: doc.id,
                        description = data["description"] as? String ?: "Coin recharge",
                        createdAt = data["createdAt"]?.toString().orEmpty()
                    )
                }

                _state.value = _state.value.copy(transactions = transactions)
            }
    }

    private fun observeCoinPackages() {
        packageListener?.remove()
        packageListener = firestore.collection("coinPackages")
            .whereEqualTo("active", true)
            .addSnapshotListener { snap, error ->
                if (error != null) {
                    android.util.Log.e("WALLET_DEBUG", "Failed to load coin packages", error)
                    _state.value = _state.value.copy(
                        error = error.message ?: "Failed to load coin packages"
                    )
                    return@addSnapshotListener
                }

                val packages = snap?.documents.orEmpty().mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    CoinPackage(
                        id = doc.id,
                        displayName = data["displayName"] as? String ?: "",
                        priceInr = (data["priceInr"] as? Number)?.toInt() ?: 0,
                        coins = (data["coins"] as? Number)?.toInt() ?: 0,
                        bonus = (data["bonus"] as? Number)?.toInt() ?: 0
                    )
                }.sortedBy { it.priceInr }

                _state.value = _state.value.copy(coinPackages = packages, error = null)
            }
    }

    fun initiateRecharge(activity: ComponentActivity, packageId: String) {
        if (_state.value.isCreatingOrder || _state.value.isAwaitingCoinCredit) return

        viewModelScope.launch {
            _state.value = _state.value.copy(isCreatingOrder = true, error = null)

            val userId = cachedUserId ?: userPreferences.userIdFlow.first()
            if (userId.isNullOrBlank()) {
                _state.value = _state.value.copy(
                    isCreatingOrder = false,
                    error = "Please login again before adding balance"
                )
                return@launch
            }

            val result = functionsSource.callCreateCashfreeOrder(
                packageId,
                userId,
                useSandbox = BuildConfig.CASHFREE_USE_SANDBOX
            )
            result.fold(
                onSuccess = { data ->
                    val orderId = data["orderId"] as? String
                    val paymentSessionId = data["paymentSessionId"] as? String

                    if (orderId == null || paymentSessionId == null) {
                        _state.value = _state.value.copy(
                            isCreatingOrder = false,
                            error = "Invalid response from server"
                        )
                        return@fold
                    }

                    _state.value = _state.value.copy(isCreatingOrder = false)
                    balanceAtCheckout = _state.value.balance
                    pendingCashfreeOrderId = orderId

                    val checkoutStarted = cashfreeManager.startPayment(
                        activity,
                        orderId,
                        paymentSessionId,
                        object : CFCheckoutResponseCallback {
                            override fun onPaymentVerify(orderId: String) {
                                beginAwaitingCoinCredit(orderId)
                            }

                            override fun onPaymentFailure(
                                error: com.cashfree.pg.core.api.utils.CFErrorResponse?,
                                orderId: String?
                            ) {
                                creditPollJob?.cancel()
                                _state.value = _state.value.copy(
                                    isAwaitingCoinCredit = false,
                                    error = mapCashfreeError(error?.message)
                                )
                            }
                        }
                    )
                    if (!checkoutStarted) {
                        _state.value = _state.value.copy(
                            isAwaitingCoinCredit = false,
                            error = _state.value.error ?: "Could not open payment page"
                        )
                    }
                },
                onFailure = { error ->
                    _state.value = _state.value.copy(
                        isCreatingOrder = false,
                        error = error.message ?: "Failed to create order"
                    )
                }
            )
        }
    }

    private fun beginAwaitingCoinCredit(orderId: String) {
        creditPollJob?.cancel()
        _state.value = _state.value.copy(isAwaitingCoinCredit = true, error = null)
        creditPollJob = viewModelScope.launch {
            val baseline = balanceAtCheckout
            val userId = cachedUserId ?: userPreferences.userIdFlow.first()
            if (userId.isNullOrBlank()) {
                _state.value = _state.value.copy(isAwaitingCoinCredit = false, error = "Please login again")
                return@launch
            }

            repeat(20) {
                if (!_state.value.isAwaitingCoinCredit || !isActive) return@launch
                if (_state.value.balance > baseline) {
                    _state.value = _state.value.copy(isAwaitingCoinCredit = false, error = null)
                    pendingCashfreeOrderId = null
                    return@launch
                }

                functionsSource.callConfirmCashfreePayment(
                    orderId,
                    userId,
                    useSandbox = BuildConfig.CASHFREE_USE_SANDBOX
                ).onSuccess { data ->
                    val credited = data["credited"] as? Boolean ?: false
                    if (credited) {
                        val newBalance = (data["newBalance"] as? Number)?.toInt()
                        if (newBalance != null && newBalance > baseline) {
                            _state.value = _state.value.copy(
                                balance = newBalance,
                                isAwaitingCoinCredit = false,
                                error = null
                            )
                        } else {
                            _state.value = _state.value.copy(isAwaitingCoinCredit = false, error = null)
                        }
                        pendingCashfreeOrderId = null
                        return@launch
                    }
                }

                delay(800)
            }

            if (_state.value.isAwaitingCoinCredit) {
                _state.value = _state.value.copy(
                    isAwaitingCoinCredit = false,
                    error = "Payment received. If coins are missing, contact support with order ID: $orderId"
                )
            }
            pendingCashfreeOrderId = null
        }
    }

    fun onPaymentCheckoutDismissed() {
        if (_state.value.isCreatingOrder) {
            _state.value = _state.value.copy(isCreatingOrder = false)
        }
    }

    fun simulateSuccessfulRecharge(pkg: CoinPackage, onComplete: () -> Unit) {
        if (_state.value.isCreatingOrder || _state.value.isAwaitingCoinCredit) return

        viewModelScope.launch {
            _state.value = _state.value.copy(isCreatingOrder = true, error = null)

            val userId = userPreferences.userIdFlow.first()
            if (userId.isNullOrBlank()) {
                _state.value = _state.value.copy(
                    isCreatingOrder = false,
                    error = "Please login again before adding balance"
                )
                return@launch
            }

            val userRef = firestore.collection("users").document(userId)
            firestore.runTransaction { transaction ->
                val snapshot = transaction.get(userRef)
                val currentBalance = (snapshot.getLong("coinBalance")
                    ?: snapshot.getLong("coins")
                    ?: 0).toLong()
                
                val addedCoins = (pkg.coins + pkg.bonus).toLong()
                val newBalance = currentBalance + addedCoins

                transaction.update(userRef, "coinBalance", newBalance)
                if (snapshot.contains("coins")) {
                    transaction.update(userRef, "coins", newBalance)
                }

                val transactionId = "sim_check_" + System.currentTimeMillis()
                val txRef = firestore.collection("coinTransactions").document(transactionId)
                val formatter = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.US)
                val txData = hashMapOf(
                    "userId" to userId,
                    "type" to "topup",
                    "amountCoins" to addedCoins,
                    "balanceAfter" to newBalance,
                    "cashfreeOrderId" to "SIM_$transactionId",
                    "description" to "Coin recharge (${pkg.displayName})",
                    "createdAt" to formatter.format(java.util.Date())
                )
                transaction.set(txRef, txData)
            }.addOnSuccessListener {
                _state.value = _state.value.copy(
                    isCreatingOrder = false,
                    isAwaitingCoinCredit = false,
                    error = null
                )
                onComplete()
            }.addOnFailureListener { e ->
                _state.value = _state.value.copy(
                    isCreatingOrder = false,
                    isAwaitingCoinCredit = false,
                    error = e.message ?: "Failed to complete transaction"
                )
            }
        }
    }

    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }

    private fun mapCashfreeError(message: String?): String {
        val raw = message ?: return "Could not open payment page. Check Cashfree keys and try again."
        return if (raw.contains("trusted source", ignoreCase = true) ||
            raw.contains("NOT_AVAILABLE", ignoreCase = true)
        ) {
            "Payments from sideloaded builds require sandbox mode. " +
                "Use a debug build (sandbox) or install from Play Store internal testing."
        } else {
            raw
        }
    }

    override fun onCleared() {
        creditPollJob?.cancel()
        cashfreeCallbackRegistry.callback = null
        walletListener?.remove()
        packageListener?.remove()
        transactionListener?.remove()
        walletObserving = false
        super.onCleared()
    }
}
