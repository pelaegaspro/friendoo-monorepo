package com.friendoo.app.data.remote.api

import android.app.Activity
import com.friendoo.app.data.repository.InsForgeRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * InsForge Auth Source - Replaces Firebase Auth with InsForge API
 */
@Singleton
class InsForgeAuthSource @Inject constructor(
    private val insForgeRepository: InsForgeRepository
) {
    private var currentUserId: String? = null
    private var authToken: String? = null
    var storedVerificationId: String? = null
    var storedPhone: String? = null

    fun sendOtp(
        phone: String,
        activity: Activity,
        callbacks: PhoneAuthCallbacks
    ) {
        storedPhone = phone
        // For now, simulate OTP - in production this would call InsForge API
        // The actual implementation would need backend support
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            val verificationId = "simulated-verification-id"
            storedVerificationId = verificationId
            callbacks.onCodeSent(verificationId, null)
        }, 1000)
    }

    suspend fun verifyOtp(verificationId: String, code: String): Result<InsForgeUser> {
        return withContext(Dispatchers.IO) {
            try {
                // For demo: accept any 6-digit code
                if (code.length == 6) {
                    val userId = "user_${System.currentTimeMillis()}"
                    currentUserId = userId
                    authToken = "token_${System.currentTimeMillis()}"
                    Result.success(InsForgeUser(userId, "+91${verificationId.takeLast(10)}"))
                } else {
                    Result.failure(Exception("Invalid OTP"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }

    fun getCurrentUser(): InsForgeUser? {
        return currentUserId?.let { InsForgeUser(it, "") }
    }

    fun signOut() {
        currentUserId = null
        authToken = null
    }

    fun getIdToken(): String? = authToken

    interface PhoneAuthCallbacks {
        fun onVerificationCompleted(user: InsForgeUser)
        fun onVerificationFailed(exception: Exception)
        fun onCodeSent(verificationId: String, token: Any?)
    }
}

data class InsForgeUser(
    val uid: String,
    val phoneNumber: String
)
