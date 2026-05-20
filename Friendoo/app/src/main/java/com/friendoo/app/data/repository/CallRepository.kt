package com.friendoo.app.data.repository

import com.friendoo.app.core.model.CallType
import com.friendoo.app.data.remote.firebase.FirebaseFunctionsSource
import com.friendoo.app.data.remote.api.InsForgeAuthSource
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FieldValue
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Data class holding the Agora credentials returned by the server.
 */
data class AgoraCredentials(
    val token: String,
    val appId: String,
    val channel: String
)

@Singleton
class CallRepository @Inject constructor(
    private val functionsSource: FirebaseFunctionsSource,
    private val firestore: FirebaseFirestore,
    private val authSource: InsForgeAuthSource
) {

    /**
     * Creates a new call document in Firestore and returns the generated callId.
     *
     * This document is required before requesting an Agora token, because the
     * Cloud Function validates that the caller is a participant of the call.
     */
    suspend fun createCall(
        receiverId: String,
        receiverAlias: String,
        ratePerMinute: Int,
        callType: CallType = CallType.AUDIO
    ): Result<String> {
        return try {
            val callerId = authSource.getCurrentUser()?.uid
                ?: return Result.failure(IllegalStateException("User not authenticated"))

            val callData = hashMapOf(
                "callerId" to callerId,
                "receiverId" to receiverId,
                "fromUserId" to callerId,
                "toUserId" to receiverId,
                "status" to "ringing",
                "callType" to callType.value,
                "agoraChannel" to "",  // Will be set to callId after creation
                "ratePerMinute" to ratePerMinute,
                "coinsSpent" to 0,
                "anonymous" to true,
                "fromDisplayName" to "User",
                "toDisplayName" to receiverAlias,
                "createdAt" to FieldValue.serverTimestamp(),
                "ringingAt" to FieldValue.serverTimestamp()
            )

            val docRef = firestore.collection("calls").add(callData).await()
            val callId = docRef.id

            // Update the agoraChannel to match the callId (used as channel name)
            docRef.update("agoraChannel", callId).await()

            Result.success(callId)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Requests an Agora RTC token from the server for the given call.
     *
     * The Cloud Function validates:
     * - The caller is authenticated
     * - The caller is a participant of the call
     * - The call status is "ringing" or "active"
     *
     * @param callId The Firestore document ID from the "calls" collection.
     * @return AgoraCredentials containing token, appId, and channel name.
     */
    suspend fun getAgoraToken(callId: String): Result<AgoraCredentials> {
        return functionsSource.callGetAgoraToken(callId).map { data ->
            AgoraCredentials(
                token = data["token"] as? String ?: "",
                appId = data["appId"] as? String ?: "",
                channel = data["channel"] as? String ?: callId
            )
        }
    }

    /**
     * Marks a ringing call as active once the local Agora client joins.
     * Server billing listens for this status transition.
     */
    suspend fun markCallActive(callId: String): Result<Unit> {
        return try {
            firestore.collection("calls").document(callId).update(
                mapOf(
                    "status" to "active",
                    "acceptedAt" to FieldValue.serverTimestamp(),
                    "startedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Deducts coins from a user's wallet for an active call.
     */
    suspend fun deductCoins(userId: String, amount: Int, callId: String, callType: String = "audio"): Result<Boolean> {
        return functionsSource.callDeductCallCoins(userId, amount, callId, callType).map {
            it["success"] as? Boolean ?: false
        }
    }

    /**
     * Updates the call status to "ended" in Firestore.
     */
    suspend fun endCall(callId: String) {
        try {
            firestore.collection("calls").document(callId).update(
                mapOf(
                    "status" to "ended",
                    "endedAt" to FieldValue.serverTimestamp(),
                    "endReason" to "user_hangup"
                )
            ).await()
        } catch (e: Exception) {
            // Best-effort; the server-side billing trigger will handle cleanup
        }
    }
}
