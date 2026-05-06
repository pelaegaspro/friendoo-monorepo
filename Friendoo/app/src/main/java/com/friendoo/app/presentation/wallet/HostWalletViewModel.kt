package com.friendoo.app.presentation.wallet

import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.friendoo.app.core.utils.TimeUtils
import com.friendoo.app.data.local.UserPreferences
import com.friendoo.app.data.model.HostEarnings
import com.friendoo.app.data.model.WithdrawalRequest
import com.friendoo.app.data.repository.HostWalletRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HostWalletUiState(
    val earnings: HostEarnings? = null,
    val history: List<WithdrawalRequest> = emptyList(),
    val nextPayoutDate: String = TimeUtils.getNextPayoutDate(),
    val isLoading: Boolean = false,
    val isSubmitting: Boolean = false,
    val error: String? = null,
    val successMessage: String? = null
)

@HiltViewModel
class HostWalletViewModel @Inject constructor(
    private val repository: HostWalletRepository,
    private val userPreferences: UserPreferences
) : ViewModel() {

    private val _uiState = mutableStateOf(HostWalletUiState())
    val uiState: State<HostWalletUiState> = _uiState

    init {
        loadData()
    }

    private fun loadData() {
        viewModelScope.launch {
            val hostId = userPreferences.userIdFlow.firstOrNull() ?: return@launch
            _uiState.value = _uiState.value.copy(isLoading = true)

            // Collect earnings
            repository.getHostEarnings(hostId).collect { result ->
                result.onSuccess { earnings ->
                    _uiState.value = _uiState.value.copy(earnings = earnings, isLoading = false)
                }.onFailure { error ->
                    _uiState.value = _uiState.value.copy(error = error.message, isLoading = false)
                }
            }
        }

        viewModelScope.launch {
            val hostId = userPreferences.userIdFlow.firstOrNull() ?: return@launch
            // Collect history
            repository.getWithdrawalHistory(hostId).collect { result ->
                result.onSuccess { history ->
                    _uiState.value = _uiState.value.copy(history = history)
                }
            }
        }
    }

    fun requestWithdrawal(amount: Double, upiId: String) {
        val earnings = _uiState.value.earnings ?: return
        
        // Validation
        if (amount < 100) {
            _uiState.value = _uiState.value.copy(error = "Minimum withdrawal amount is ₹100")
            return
        }
        if (amount > earnings.availableForWithdrawal) {
            _uiState.value = _uiState.value.copy(error = "Insufficient balance")
            return
        }
        if (!validateUpi(upiId)) {
            _uiState.value = _uiState.value.copy(error = "Invalid UPI ID")
            return
        }

        viewModelScope.launch {
            val hostId = userPreferences.userIdFlow.firstOrNull() ?: return@launch
            _uiState.value = _uiState.value.copy(isSubmitting = true, error = null, successMessage = null)
            
            val result = repository.requestWithdrawal(hostId, amount, upiId)
            
            result.onSuccess {
                _uiState.value = _uiState.value.copy(
                    isSubmitting = false,
                    successMessage = "Withdrawal request submitted successfully!"
                )
            }.onFailure { error ->
                _uiState.value = _uiState.value.copy(
                    isSubmitting = false,
                    error = error.message ?: "Failed to submit request"
                )
            }
        }
    }

    private fun validateUpi(upiId: String): Boolean {
        val pattern = Regex("[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64}")
        return pattern.matches(upiId)
    }

    fun clearMessages() {
        _uiState.value = _uiState.value.copy(error = null, successMessage = null)
    }
}
