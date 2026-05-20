package com.friendoo.app.presentation.auth

import android.app.Activity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.friendoo.app.data.local.UserPreferences
import com.friendoo.app.data.remote.api.InsForgeAuthSource
import com.friendoo.app.data.remote.api.InsForgeUser
import com.friendoo.app.data.repository.AuthRepository
import com.google.firebase.firestore.FirebaseFirestore
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
    private val authSource: InsForgeAuthSource,
    private val firestore: FirebaseFirestore,
    private val userPreferences: UserPreferences
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
                    // Simulates auto-verification
                    viewModelScope.launch {
                        checkProfileAndEmitSuccess(user.uid)
                    }
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
                val user = result.getOrNull()
                if (user != null) {
                    checkProfileAndEmitSuccess(user.uid)
                } else {
                    _authState.value = AuthState.Error("User verification succeeded but user was null")
                }
            } else {
                _authState.value = AuthState.Error(result.exceptionOrNull()?.message ?: "Invalid OTP")
            }
        }
    }

    private suspend fun checkProfileAndEmitSuccess(uid: String) {
        try {
            val snapshot = firestore.collection("users").document(uid).get().await()
            if (snapshot.exists()) {
                val completed = snapshot.getBoolean("onboardingCompleted") == true
                        || snapshot.getBoolean("onboardingComplete") == true
                val isHost = snapshot.getBoolean("isHost") == true
                        || snapshot.getString("accountType").equals("host", ignoreCase = true)

                // Save to local user preferences
                userPreferences.setOnboardingCompleted(completed)
                userPreferences.setIsHost(isHost)

                _authState.value = AuthState.Success(onboardingCompleted = completed, isHost = isHost)
            } else {
                // New user
                userPreferences.setOnboardingCompleted(false)
                userPreferences.setIsHost(false)
                _authState.value = AuthState.Success(onboardingCompleted = false, isHost = false)
            }
        } catch (e: Exception) {
            // Safe fallback to onboarding on error
            userPreferences.setOnboardingCompleted(false)
            userPreferences.setIsHost(false)
            _authState.value = AuthState.Success(onboardingCompleted = false, isHost = false)
        }
    }
}

