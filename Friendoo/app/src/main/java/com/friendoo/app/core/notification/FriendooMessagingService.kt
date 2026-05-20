package com.friendoo.app.core.notification

import android.util.Log
import com.friendoo.app.data.remote.api.InsForgeAuthSource
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class FriendooMessagingService : FirebaseMessagingService() {

    @Inject
    lateinit var authSource: InsForgeAuthSource

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        sendRegistrationToServer(token)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        // Handle foreground notifications if needed
        Log.d("FCM", "Message received: ${remoteMessage.data}")
    }

    private fun sendRegistrationToServer(token: String) {
        val userId = authSource.getCurrentUser()?.uid ?: return
        val db = FirebaseFirestore.getInstance()
        
        db.collection("users").document(userId).update(
            "fcmTokens", FieldValue.arrayUnion(token)
        ).addOnFailureListener { e ->
            Log.e("FCM", "Failed to send registration token to server: ${e.message}")
        }
    }
}
