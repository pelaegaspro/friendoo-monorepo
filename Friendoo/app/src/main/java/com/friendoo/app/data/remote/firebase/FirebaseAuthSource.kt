package com.friendoo.app.data.remote.firebase

import android.app.Activity
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthOptions
import com.google.firebase.auth.PhoneAuthProvider
import kotlinx.coroutines.tasks.await
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FirebaseAuthSource @Inject constructor(
    private val auth: FirebaseAuth
) {
    fun sendOtp(
        phone: String,
        activity: Activity,
        callbacks: PhoneAuthProvider.OnVerificationStateChangedCallbacks
    ) {
        val options = PhoneAuthOptions.newBuilder(auth)
            .setPhoneNumber(phone)
            .setTimeout(60L, TimeUnit.SECONDS)
            .setActivity(activity)
            .setCallbacks(callbacks)
            .build()
        PhoneAuthProvider.verifyPhoneNumber(options)
    }

    suspend fun verifyOtp(verificationId: String, code: String): Result<FirebaseUser> {
        return try {
            val credential = PhoneAuthProvider.getCredential(verificationId, code)
            val result = auth.signInWithCredential(credential).await()
            val user = result.user ?: throw Exception("User is null after sign in")
            Result.success(user)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun getCurrentUser(): FirebaseUser? = auth.currentUser

    fun signOut() {
        auth.signOut()
    }

    suspend fun getIdToken(): String? {
        return try {
            val user = auth.currentUser ?: return null
            val result = user.getIdToken(true).await()
            result.token
        } catch (e: Exception) {
            null
        }
    }
}
