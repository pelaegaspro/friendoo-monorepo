package com.friendoo.app.data.remote.firebase

import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FcmTokenSource @Inject constructor(
    private val messaging: FirebaseMessaging
) {
    suspend fun getToken(): String? {
        return try {
            messaging.token.await()
        } catch (e: Exception) {
            null
        }
    }

    suspend fun subscribeToTopic(topic: String) {
        try {
            messaging.subscribeToTopic(topic).await()
        } catch (e: Exception) {
            // Log error
        }
    }

    suspend fun deleteToken() {
        try {
            messaging.deleteToken().await()
        } catch (e: Exception) {
            // Log error
        }
    }
}
