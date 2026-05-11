package com.friendoo.app.data.remote.firebase

import javax.inject.Inject
import javax.inject.Singleton

/**
 * Stub Firebase Auth Source - Firebase dependencies removed
 */
@Singleton
class FirebaseAuthSource @Inject constructor() {
    fun sendOtp(phone: String, activity: android.app.Activity, callbacks: Any) {
        // Stub - no-op
    }

    suspend fun verifyOtp(verificationId: String, code: String): Result<Any> {
        return Result.success("stub-user")
    }

    fun getCurrentUser(): Any? = null

    fun signOut() {
        // Stub - no-op
    }

    suspend fun getIdToken(): String? = "stub-token"
}
