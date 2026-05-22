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
    private val firebaseAuth: FirebaseAuthSource,
    private val userPreferences: UserPreferences
) {
    @Volatile
    var storedVerificationId: String? = null

    @Volatile
    var storedResendToken: PhoneAuthProvider.ForceResendingToken? = null

    fun sendOtp(
        phone: String,
        activity: Activity,
        callbacks: PhoneAuthProvider.OnVerificationStateChangedCallbacks
    ) {
        firebaseAuth.sendOtp(phone, activity, callbacks)
    }

    fun resendOtp(
        phone: String,
        activity: Activity,
        callbacks: PhoneAuthProvider.OnVerificationStateChangedCallbacks
    ) {
        val token = storedResendToken
        if (token != null) {
            firebaseAuth.resendOtp(phone, activity, token, callbacks)
        } else {
            sendOtp(phone, activity, callbacks)
        }
    }

    suspend fun verifyOtp(verificationId: String, code: String): Result<FirebaseUser> {
        return persistSession(firebaseAuth.verifyOtp(verificationId, code))
    }

    suspend fun signInWithCredential(credential: com.google.firebase.auth.PhoneAuthCredential): Result<FirebaseUser> {
        return persistSession(firebaseAuth.signInWithCredential(credential))
    }

    private suspend fun persistSession(result: Result<FirebaseUser>): Result<FirebaseUser> {
        result.onSuccess { user ->
            user.uid.let { userPreferences.saveUserId(it) }
            firebaseAuth.getIdToken()?.let { userPreferences.saveAuthToken(it) }
        }
        return result
    }

    fun getCurrentUser(): FirebaseUser? = firebaseAuth.getCurrentUser()

    fun getCurrentUserId(): String? = firebaseAuth.getCurrentUser()?.uid

    fun getCurrentUserPhone(): String? = firebaseAuth.getCurrentUser()?.phoneNumber

    suspend fun signOut() {
        firebaseAuth.signOut()
        userPreferences.clearAll()
        storedVerificationId = null
        storedResendToken = null
    }

    suspend fun refreshIdToken(): String? {
        val token = firebaseAuth.getIdToken()
        token?.let { userPreferences.saveAuthToken(it) }
        return token
    }
}
