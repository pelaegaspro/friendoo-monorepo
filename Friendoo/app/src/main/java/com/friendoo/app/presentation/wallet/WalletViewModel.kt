package com.friendoo.app.presentation.wallet

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cashfree.pg.core.api.callback.CFCheckoutResponseCallback
import com.friendoo.app.core.payment.CashfreeManager
import com.friendoo.app.data.local.UserPreferences
import com.friendoo.app.data.remote.api.dto.TransactionDto
import com.friendoo.app.data.remote.firebase.FirebaseFunctionsSource
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.Query
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
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
    val isProcessingPayment: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class WalletViewModel @Inject constructor(
    private val userPreferences: UserPreferences,
    private val functionsSource: FirebaseFunctionsSource,
    private val cashfreeManager: CashfreeManager,
    private val firestore: FirebaseFirestore
) : ViewModel() {

    private val _state = MutableStateFlow(WalletUiState())
    val state: StateFlow<WalletUiState> = _state
    val isHostFlow = userPreferences.isHostFlow

    private var walletListener: ListenerRegistration? = null
    private var packageListener: ListenerRegistration? = null
    private var transactionListener: ListenerRegistration? = null

    init {
        observeWalletData()
        observeCoinPackages()
    }

    fun loadWalletData() {
        observeWalletData()
    }

    private fun observeWalletData() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            val userId = userPreferences.userIdFlow.first() ?: return@launch

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
                        isProcessingPayment = if (nextBalance > previousBalance) false else _state.value.isProcessingPayment,
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

    fun initiateRecharge(context: Context, packageId: String) {
        if (_state.value.isProcessingPayment) return

        viewModelScope.launch {
            _state.value = _state.value.copy(isProcessingPayment = true, error = null)

            val userId = userPreferences.userIdFlow.first()
            if (userId.isNullOrBlank()) {
                _state.value = _state.value.copy(
                    isProcessingPayment = false,
                    error = "Please login again before adding balance"
                )
                return@launch
            }

            val result = functionsSource.callCreateCashfreeOrder(packageId, userId)
            result.fold(
                onSuccess = { data ->
                    val orderId = data["orderId"] as? String
                    val paymentSessionId = data["paymentSessionId"] as? String

                    if (orderId == null || paymentSessionId == null) {
                        _state.value = _state.value.copy(
                            isProcessingPayment = false,
                            error = "Invalid response from server"
                        )
                        return@fold
                    }

                    cashfreeManager.startPayment(context, orderId, paymentSessionId, object : CFCheckoutResponseCallback {
                        override fun onPaymentVerify(orderId: String) {
                            waitForBalanceListenerCredit()
                        }

                        override fun onPaymentFailure(
                            error: com.cashfree.pg.core.api.utils.CFErrorResponse?,
                            orderId: String?
                        ) {
                            _state.value = _state.value.copy(
                                isProcessingPayment = false,
                                error = error?.message ?: "Payment failed"
                            )
                        }
                    })
                },
                onFailure = { error ->
                    _state.value = _state.value.copy(
                        isProcessingPayment = false,
                        error = error.message ?: "Failed to create order"
                    )
                }
            )
        }
    }

    private fun waitForBalanceListenerCredit() {
        viewModelScope.launch {
            delay(30_000)
            if (_state.value.isProcessingPayment) {
                _state.value = _state.value.copy(
                    isProcessingPayment = false,
                    error = "Payment is being processed. Coins will be credited shortly."
                )
            }
        }
    }

    fun simulateSuccessfulRecharge(pkg: CoinPackage, onComplete: () -> Unit) {
        if (_state.value.isProcessingPayment) return

        viewModelScope.launch {
            _state.value = _state.value.copy(isProcessingPayment = true, error = null)

            val userId = userPreferences.userIdFlow.first()
            if (userId.isNullOrBlank()) {
                _state.value = _state.value.copy(
                    isProcessingPayment = false,
                    error = "Please login again before adding balance"
                )
                return@launch
            }

            // Simulate payment processing duration
            delay(1500)

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
                    isProcessingPayment = false,
                    error = null
                )
                onComplete()
            }.addOnFailureListener { e ->
                _state.value = _state.value.copy(
                    isProcessingPayment = false,
                    error = e.message ?: "Failed to complete transaction"
                )
            }
        }
    }

    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }

    override fun onCleared() {
        walletListener?.remove()
        packageListener?.remove()
        transactionListener?.remove()
        super.onCleared()
    }
}
