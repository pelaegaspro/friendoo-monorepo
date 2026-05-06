package com.friendoo.app.core.tracking

import android.os.Build
import com.friendoo.app.data.local.UserPreferences
import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AnalyticsTracker @Inject constructor(
    private val firestore: FirebaseFirestore,
    private val auth: FirebaseAuth,
    private val userPreferences: UserPreferences
) {
    private val sessionId = UUID.randomUUID().toString()

    /**
     * Logs a platform event silently for administrative oversight.
     * Respects user consent as per DPDPA 2023 regulations.
     */
    fun logEvent(eventType: String, metadata: Map<String, Any?> = emptyMap()) {
        // Essential check for consent before non-essential tracking
        val hasConsent = runBlocking { userPreferences.consentGivenFlow.first() }
        if (!hasConsent) return

        val userId = auth.currentUser?.uid ?: "anonymous"
        
        val log = hashMapOf(
            "userId" to userId,
            "sessionId" to sessionId,
            "eventType" to eventType,
            "metadata" to metadata,
            "timestamp" to Timestamp.now(),
            "deviceInfo" to hashMapOf(
                "model" to Build.MODEL,
                "osVersion" to Build.VERSION.RELEASE,
                "appVersion" to "1.0.0"
            )
        )

        firestore.collection("userBehaviorLogs")
            .add(log)
            .addOnFailureListener {
                // Silent fail
            }
    }

    fun logPageView(screenName: String) {
        logEvent("page_view", mapOf("screen" to screenName))
    }

    fun logButtonClick(buttonName: String, screenName: String) {
        logEvent("button_click", mapOf("button" to buttonName, "screen" to screenName))
    }
}
