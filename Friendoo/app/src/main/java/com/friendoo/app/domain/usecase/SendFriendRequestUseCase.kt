package com.friendoo.app.domain.usecase

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FieldValue
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

class SendFriendRequestUseCase @Inject constructor(
    private val firestore: FirebaseFirestore
) {
    suspend operator fun invoke(fromId: String, toId: String): Result<Unit> {
        return try {
            val requestData = hashMapOf(
                "fromUserId" to fromId,
                "toUserId" to toId,
                "status" to "pending",
                "createdAt" to FieldValue.serverTimestamp()
            )
            firestore.collection("friendRequests").add(requestData).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
