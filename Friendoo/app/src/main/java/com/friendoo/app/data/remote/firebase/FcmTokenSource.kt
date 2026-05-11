package com.friendoo.app.data.remote.firebase

import javax.inject.Inject
import javax.inject.Singleton

/**
 * Stub FCM Token Source - Firebase dependencies removed
 */
@Singleton
class FcmTokenSource @Inject constructor() {
    suspend fun getToken(): String? {
        return "stub-token"
    }

    suspend fun subscribeToTopic(topic: String) {
        // Stub - no-op
    }

    suspend fun deleteToken() {
        // Stub - no-op
    }
}
