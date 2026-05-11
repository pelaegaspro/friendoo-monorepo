package com.friendoo.app.presentation.auth

import android.app.Activity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.friendoo.app.data.remote.api.InsForgeAuthSource
import com.friendoo.app.data.remote.api.InsForgeUser
import com.friendoo.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    object CodeSent : AuthState()
    object Success : AuthState()
    data class Error(val message: String) : AuthState()
}

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val authSource: InsForgeAuthSource
) : ViewModel() {

    private val _authState = MutableStateFlow<AuthState>(AuthState.Idle)
    val authState: StateFlow<AuthState> = _authState

    fun sendOtp(phone: String, activity: Activity) {
        _authState.value = AuthState.Loading
        authRepository.sendOtp(
            phone = phone,
            activity = activity,
            callbacks = object : InsForgeAuthSource.PhoneAuthCallbacks {
                override fun onVerificationCompleted(user: InsForgeUser) {
                    _authState.value = AuthState.Success
                }

                override fun onVerificationFailed(exception: Exception) {
                    _authState.value = AuthState.Error(exception.message ?: "Verification failed")
                }

                override fun onCodeSent(verificationId: String, token: Any?) {
                    _authState.value = AuthState.CodeSent
                }
            }
        )
    }

    fun verifyCode(code: String) {
        // Use singleton-stored verification ID so it persists across nav screens
        val verificationId = authSource.storedVerificationId ?: "simulated-verification-id"
        _authState.value = AuthState.Loading
        viewModelScope.launch {
            val result = authRepository.verifyOtp(verificationId, code)
            if (result.isSuccess) {
                _authState.value = AuthState.Success
            } else {
                _authState.value = AuthState.Error(result.exceptionOrNull()?.message ?: "Invalid OTP")
            }
        }
    }
}
