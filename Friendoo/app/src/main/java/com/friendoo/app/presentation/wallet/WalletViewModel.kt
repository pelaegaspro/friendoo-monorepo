package com.friendoo.app.presentation.wallet

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cashfree.pg.core.api.callback.CFCheckoutResponseCallback
import com.cashfree.pg.core.api.utils.CFErrorResponse
import com.friendoo.app.core.payment.CashfreeManager
import com.friendoo.app.core.utils.CryptoUtils
import com.friendoo.app.data.local.UserPreferences
import com.friendoo.app.data.remote.firebase.FirebaseFunctionsSource
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

data class WalletUiState(
    val balance: Double = 0.0,
    val totalEarned: Double = 0.0,
    val isUpiVerified: Boolean = false,
    val transactions: List<Transaction> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

data class Transaction(
    val id: String,
    val type: String, // "credit" | "payout"
    val amount: Double,
    val timestamp: Timestamp
)

@HiltViewModel
class WalletViewModel @Inject constructor(
    private val firestore: FirebaseFirestore,
    private val userPreferences: UserPreferences,
    private val functionsSource: FirebaseFunctionsSource,
    private val cashfreeManager: CashfreeManager
) : ViewModel() {

    private val _state = MutableStateFlow(WalletUiState())
    val state: StateFlow<WalletUiState> = _state

    init {
        loadWalletData()
    }

    fun loadWalletData() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            val userId = userPreferences.userIdFlow.first() ?: return@launch
            
            // 1. Listen to Host Document for balance/status
            firestore.collection("hosts").document(userId).addSnapshotListener { snapshot, _ ->
                snapshot?.let {
                    _state.value = _state.value.copy(
                        balance = it.getDouble("walletBalance") ?: 0.0,
                        totalEarned = it.getDouble("totalEarned") ?: 0.0,
                        isUpiVerified = it.getBoolean("upiVerified") ?: false
                    )
                }
            }

            // 2. Load Transactions
            firestore.collection("transactions")
                .whereEqualTo("hostId", userId)
                .orderBy("timestamp", com.google.firebase.firestore.Query.Direction.DESCENDING)
                .addSnapshotListener { snapshot, _ ->
                    snapshot?.let {
                        val txs = it.docs.map { doc ->
                            Transaction(
                                id = doc.id,
                                type = doc.getString("type") ?: "credit",
                                amount = doc.getDouble("amount") ?: 0.0,
                                timestamp = doc.getTimestamp("timestamp") ?: Timestamp.now()
                            )
                        }
                        _state.value = _state.value.copy(transactions = txs, isLoading = false)
                    }
                }
        }
    }

    fun requestWithdrawal(amount: Double, upiId: String? = null) {
        viewModelScope.launch {
            val userId = userPreferences.userIdFlow.first() ?: return@launch
            
            if (amount < 200) {
                _state.value = _state.value.copy(error = "Minimum withdrawal is ₹200")
                return@launch
            }

            if (amount > _state.value.balance) {
                _state.value = _state.value.copy(error = "Insufficient balance")
                return@launch
            }

            val payoutData = mutableMapOf<String, Any>(
                "amount" to amount,
                "requestedAt" to Timestamp.now(),
                "status" to "pending"
            )

            // If it's the first withdrawal, encrypt and save the UPI ID
            if (!_state.value.isUpiVerified && upiId != null) {
                val encryptedUpi = CryptoUtils.encrypt(upiId)
                if (encryptedUpi != null) {
                    firestore.collection("hosts").document(userId).update(
                        mapOf(
                            "upiEncrypted" to encryptedUpi,
                            "upiVerified" to true,
                            "upiId" to upiId // Also stored for ₹1 test credit check
                        )
                    )
                    payoutData["upiId"] = upiId
                }
            }

            firestore.collection("hosts").document(userId)
                .collection("payoutHistory").add(payoutData)
                .addOnSuccessListener {
                    _state.value = _state.value.copy(error = null)
                }
                .addOnFailureListener {
                    _state.value = _state.value.copy(error = it.message)
                }
        }
    }

    fun initiateRecharge(context: Context, amount: Double) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            val result = functionsSource.callCreateCashfreeOrder(amount)
            result.onSuccess { data ->
                val orderId = data["orderId"] as? String
                val paymentSessionId = data["paymentSessionId"] as? String
                
                if (orderId != null && paymentSessionId != null) {
                    cashfreeManager.startPayment(context, orderId, paymentSessionId, object : CFCheckoutResponseCallback {
                        override fun onPaymentVerify(orderId: String) {
                            verifyRecharge(orderId)
                        }

                        override fun onPaymentFailure(cfErrorResponse: CFErrorResponse, orderId: String) {
                            _state.value = _state.value.copy(isLoading = false, error = cfErrorResponse.message)
                        }
                    })
                } else {
                    _state.value = _state.value.copy(isLoading = false, error = "Failed to create order")
                }
            }.onFailure {
                _state.value = _state.value.copy(isLoading = false, error = it.message)
            }
        }
    }

    private fun verifyRecharge(orderId: String) {
        viewModelScope.launch {
            val userId = userPreferences.userIdFlow.first() ?: return@launch
            // amount here is a bit tricky, better to let backend handle it via orderId
            functionsSource.callRechargeWallet(userId, 0, orderId).onSuccess {
                loadWalletData() // Refresh
            }.onFailure {
                _state.value = _state.value.copy(error = "Verification failed: ${it.message}")
            }
        }
    }

    fun recharge(amount: Int, paymentId: String) {
        // Legacy method used in UI, can be redirected to initiateRecharge if context is available
    }
}
