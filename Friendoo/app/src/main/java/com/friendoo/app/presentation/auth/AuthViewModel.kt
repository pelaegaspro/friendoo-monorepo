package com.friendoo.app.presentation.auth

import android.app.Activity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.friendoo.app.data.repository.AuthRepository
import com.google.firebase.FirebaseException
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthProvider
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
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _authState = MutableStateFlow<AuthState>(AuthState.Idle)
    val authState: StateFlow<AuthState> = _authState

    private var storedVerificationId: String? = null

    fun sendOtp(phone: String, activity: Activity) {
        _authState.value = AuthState.Loading
        authRepository.sendOtp(
            phone = phone,
            activity = activity,
            callbacks = object : PhoneAuthProvider.OnVerificationStateChangedCallbacks() {
                override fun onVerificationCompleted(credential: PhoneAuthCredential) {
                    verifyCredential(credential)
                }

                override fun onVerificationFailed(e: FirebaseException) {
                    _authState.value = AuthState.Error(e.message ?: "Verification failed")
                }

                override fun onCodeSent(verificationId: String, token: PhoneAuthProvider.ForceResendingToken) {
                    storedVerificationId = verificationId
                    _authState.value = AuthState.CodeSent
                }
            }
        )
    }

    fun verifyCode(code: String) {
        val verificationId = storedVerificationId ?: return
        _authState.value = AuthState.Loading
        viewModelScope.launch {
            val result = authRepository.verifyOtp(verificationId, code)
            if (result.isSuccess) {
                _authState.value = AuthState.Success
            } else {
                _authState.value = AuthState.Error(result.exceptionOrNull()?.message ?: "Unknown error")
            }
        }
    }

    private fun verifyCredential(credential: PhoneAuthCredential) {
        _authState.value = AuthState.Loading
        viewModelScope.launch {
            val code = credential.smsCode
            if (code != null && storedVerificationId != null) {
                verifyCode(code)
            }
        }
    }
}
