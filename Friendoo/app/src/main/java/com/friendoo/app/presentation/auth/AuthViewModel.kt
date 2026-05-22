package com.friendoo.app.presentation.auth

import android.app.Activity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.friendoo.app.data.local.UserPreferences
import com.friendoo.app.data.repository.AuthRepository
import com.google.firebase.FirebaseException
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthProvider
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Source
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    object CodeSent : AuthState()
    data class Success(val onboardingCompleted: Boolean, val isHost: Boolean) : AuthState()
    data class Error(val message: String) : AuthState()
}

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val firestore: FirebaseFirestore,
    private val userPreferences: UserPreferences
) : ViewModel() {

    private val _authState = MutableStateFlow<AuthState>(AuthState.Idle)
    val authState: StateFlow<AuthState> = _authState

    var lastPhone: String = ""
        private set

    private val phoneAuthCallbacks = object : PhoneAuthProvider.OnVerificationStateChangedCallbacks() {
        override fun onVerificationCompleted(credential: PhoneAuthCredential) {
            viewModelScope.launch {
                _authState.value = AuthState.Loading
                completeSignIn(credential)
            }
        }

        override fun onVerificationFailed(e: FirebaseException) {
            _authState.value = AuthState.Error(e.message ?: "Verification failed")
        }

        override fun onCodeSent(verificationId: String, token: PhoneAuthProvider.ForceResendingToken) {
            authRepository.storedVerificationId = verificationId
            authRepository.storedResendToken = token
            _authState.value = AuthState.CodeSent
        }
    }

    fun sendOtp(phone: String, activity: Activity) {
        val normalized = normalizePhone(phone)
        if (normalized.length < 12) {
            _authState.value = AuthState.Error("Enter a valid 10-digit mobile number")
            return
        }
        lastPhone = normalized
        _authState.value = AuthState.Loading
        authRepository.sendOtp(normalized, activity, phoneAuthCallbacks)
    }

    fun verifyCode(code: String) {
        val verificationId = authRepository.storedVerificationId
        if (verificationId.isNullOrBlank()) {
            _authState.value = AuthState.Error("Session expired. Request a new OTP.")
            return
        }
        if (code.length != 6) {
            _authState.value = AuthState.Error("Enter the 6-digit OTP")
            return
        }
        _authState.value = AuthState.Loading
        viewModelScope.launch {
            val result = authRepository.verifyOtp(verificationId, code)
            result.fold(
                onSuccess = { user -> checkProfileAndEmitSuccess(user.uid) },
                onFailure = { error ->
                    val message = when (error) {
                        is FirebaseAuthInvalidCredentialsException -> "Invalid OTP. Try again."
                        else -> error.message ?: "Invalid OTP"
                    }
                    _authState.value = AuthState.Error(message)
                }
            )
        }
    }

    fun resendOtp(phone: String, activity: Activity) {
        lastPhone = normalizePhone(phone)
        _authState.value = AuthState.Loading
        authRepository.resendOtp(lastPhone, activity, phoneAuthCallbacks)
    }

    private suspend fun completeSignIn(credential: PhoneAuthCredential) {
        val result = authRepository.signInWithCredential(credential)
        result.fold(
            onSuccess = { user -> checkProfileAndEmitSuccess(user.uid) },
            onFailure = { error ->
                _authState.value = AuthState.Error(error.message ?: "Sign-in failed")
            }
        )
    }

    private suspend fun checkProfileAndEmitSuccess(uid: String) {
        try {
            val docRef = firestore.collection("users").document(uid)
            val snapshot = try {
                val cacheSnap = docRef.get(Source.CACHE).await()
                if (cacheSnap.exists()) cacheSnap else docRef.get(Source.SERVER).await()
            } catch (e: Exception) {
                docRef.get(Source.SERVER).await()
            }
            
            if (snapshot.exists()) {
                val completed = snapshot.getBoolean("onboardingCompleted") == true
                    || snapshot.getBoolean("onboardingComplete") == true
                val isHost = snapshot.getBoolean("isHost") == true
                    || snapshot.getString("accountType").equals("host", ignoreCase = true)

                userPreferences.saveUserId(uid)
                userPreferences.setOnboardingCompleted(completed)
                userPreferences.setIsHost(isHost)
                authRepository.refreshIdToken()

                _authState.value = AuthState.Success(onboardingCompleted = completed, isHost = isHost)
            } else {
                userPreferences.saveUserId(uid)
                userPreferences.setOnboardingCompleted(false)
                userPreferences.setIsHost(false)
                authRepository.refreshIdToken()
                _authState.value = AuthState.Success(onboardingCompleted = false, isHost = false)
            }
        } catch (e: Exception) {
            _authState.value = AuthState.Error(
                e.message ?: "Could not load profile. Check network and try again."
            )
        }
    }

    private fun normalizePhone(phone: String): String {
        val digits = phone.filter { it.isDigit() }
        return when {
            digits.startsWith("91") && digits.length >= 12 -> "+$digits"
            digits.length == 10 -> "+91$digits"
            phone.startsWith("+") -> phone
            else -> "+$digits"
        }
    }
}
