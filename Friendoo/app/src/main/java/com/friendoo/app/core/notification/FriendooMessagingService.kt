package com.friendoo.app.core.notification

import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class FriendooMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        sendRegistrationToServer(token)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        // Handle foreground notifications if needed
    }

    private fun sendRegistrationToServer(token: String) {
        val userId = FirebaseAuth.getInstance().currentUser?.uid ?: return
        val db = FirebaseFirestore.getInstance()
        
        db.collection("users").doc(userId).update(
            "fcmTokens", FieldValue.arrayUnion(token)
        )
    }
}
