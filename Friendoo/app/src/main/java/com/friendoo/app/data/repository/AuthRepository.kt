package com.friendoo.app.data.repository

import android.app.Activity
import com.friendoo.app.data.local.UserPreferences
import com.friendoo.app.data.remote.firebase.FirebaseAuthSource
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.PhoneAuthProvider
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val authSource: FirebaseAuthSource,
    private val userPreferences: UserPreferences
) {
    fun sendOtp(phone: String, activity: Activity, callbacks: PhoneAuthProvider.OnVerificationStateChangedCallbacks) {
        authSource.sendOtp(phone, activity, callbacks)
    }

    suspend fun verifyOtp(verificationId: String, code: String): Result<FirebaseUser> {
        val result = authSource.verifyOtp(verificationId, code)
        result.onSuccess { user ->
            userPreferences.saveUserId(user.uid)
            authSource.getIdToken()?.let { userPreferences.saveAuthToken(it) }
        }
        return result
    }

    fun getCurrentUser(): FirebaseUser? = authSource.getCurrentUser()

    suspend fun signOut() {
        authSource.signOut()
        userPreferences.clearAll()
    }
}
