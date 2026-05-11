package com.friendoo.app.data.repository

import android.app.Activity
import com.friendoo.app.data.local.UserPreferences
import com.friendoo.app.data.remote.api.InsForgeAuthSource
import com.friendoo.app.data.remote.api.InsForgeUser
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val authSource: InsForgeAuthSource,
    private val userPreferences: UserPreferences
) {
    fun sendOtp(phone: String, activity: Activity, callbacks: InsForgeAuthSource.PhoneAuthCallbacks) {
        authSource.sendOtp(phone, activity, callbacks)
    }

    suspend fun verifyOtp(verificationId: String, code: String): Result<InsForgeUser> {
        val result = authSource.verifyOtp(verificationId, code)
        result.onSuccess { user ->
            userPreferences.saveUserId(user.uid)
            authSource.getIdToken()?.let { userPreferences.saveAuthToken(it) }
        }
        return result
    }

    fun getCurrentUser(): InsForgeUser? = authSource.getCurrentUser()

    suspend fun signOut() {
        authSource.signOut()
        userPreferences.clearAll()
    }
}
