package com.friendoo.app.core.notification

import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class FriendooMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        sendRegistrationToServer(token)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        val data = remoteMessage.data
        when (data["type"]) {
            "incoming_call" -> {
                val callId = data["callId"] ?: return
                val callerAlias = data["callerAlias"] ?: "Someone"
                CallNotificationHelper.showIncomingCall(this, callId, callerAlias)
            }
            else -> Log.d("FCM", "Message: $data")
        }
    }

    private fun sendRegistrationToServer(token: String) {
        val userId = FirebaseAuth.getInstance().currentUser?.uid ?: return
        FirebaseFirestore.getInstance()
            .collection("users")
            .document(userId)
            .update("fcmTokens", FieldValue.arrayUnion(token))
            .addOnFailureListener { e ->
                Log.e("FCM", "Failed to register token: ${e.message}")
            }
    }
}
