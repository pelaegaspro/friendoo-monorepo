package com.friendoo.app.core.notification

import android.util.Log

/**
 * Stub FCM Service - Firebase dependencies removed
 * In production, replace with actual Firebase implementation
 */
class FriendooMessagingService {
    fun onNewToken(token: String) {
        Log.d("FCM", "New token: $token")
    }

    fun onMessageReceived(remoteMessage: Any) {
        Log.d("FCM", "Message received")
    }
}
