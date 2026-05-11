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
import com.friendoo.app.data.repository.InsForgeRepository
import com.friendoo.app.data.remote.api.dto.TransactionDto
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
    val transactions: List<TransactionDto> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

// Using TransactionDto from repository

@HiltViewModel
class WalletViewModel @Inject constructor(
    private val insForgeRepository: InsForgeRepository,
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
            
            // Load wallet data from InsForge
            insForgeRepository.getHostProfile(userId).onSuccess { hostDto ->
                _state.value = _state.value.copy(
                    balance = hostDto.earningsInr?.toDoubleOrNull() ?: 0.0,
                    totalEarned = hostDto.totalMinutes * 3.0, // Approximate
                    isUpiVerified = hostDto.upiId?.isNotBlank() ?: false,
                    isLoading = false
                )
            }.onFailure {
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = "Failed to load wallet: ${it.message}"
                )
            }

            // Load transactions from InsForge
            insForgeRepository.getHostTransactions(userId).onSuccess { transactions ->
                _state.value = _state.value.copy(transactions = transactions)
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

            // Submit withdrawal request via InsForge
            insForgeRepository.requestWithdrawal(userId, amount, upiId).onSuccess {
                _state.value = _state.value.copy(
                    error = null,
                    balance = _state.value.balance - amount
                )
            }.onFailure {
                _state.value = _state.value.copy(error = "Withdrawal failed: ${it.message}")
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
            functionsSource.callRechargeWallet(userId, 0, orderId).onSuccess {
                loadWalletData() // Refresh
            }.onFailure {
                _state.value = _state.value.copy(error = "Verification failed: ${it.message}")
            }
        }
    }

    fun recharge(amount: Int, paymentId: String) {
        // Legacy method used in UI
    }
}
