package com.friendoo.app.data.remote.firebase

import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FcmTokenSource @Inject constructor() {
    suspend fun getToken(): String? {
        return try {
            FirebaseMessaging.getInstance().token.await()
        } catch (e: Exception) {
            null
        }
    }

    suspend fun subscribeToTopic(topic: String) {
        try {
            FirebaseMessaging.getInstance().subscribeToTopic(topic).await()
        } catch (e: Exception) {
            // Silent fail
        }
    }

    suspend fun deleteToken() {
        try {
            FirebaseMessaging.getInstance().deleteToken().await()
        } catch (e: Exception) {
            // Silent fail
        }
    }
}
