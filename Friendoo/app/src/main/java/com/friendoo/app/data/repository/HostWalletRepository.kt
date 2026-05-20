package com.friendoo.app.data.repository

import com.friendoo.app.data.model.HostEarnings
import com.friendoo.app.data.model.WithdrawalRequest
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.util.Date
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class HostWalletRepository @Inject constructor(
    private val firestore: FirebaseFirestore,
    private val insForgeRepository: InsForgeRepository
) {
    fun getHostEarnings(hostId: String): Flow<Result<HostEarnings>> = callbackFlow {
        val listener = firestore.collection("hosts").document(hostId)
            .addSnapshotListener { snap, error ->
                if (error != null) {
                    trySend(Result.failure(error))
                    return@addSnapshotListener
                }
                if (snap != null && snap.exists()) {
                    val data = snap.data ?: emptyMap()
                    val earnings = HostEarnings(
                        id = snap.id,
                        hostId = hostId,
                        totalEarningsInr = (data["totalEarnings"] as? Number)?.toDouble() ?: 0.0,
                        availableForWithdrawal = (data["availableForWithdrawal"] as? Number)?.toDouble() ?: 0.0,
                        pendingWithdrawal = (data["pendingWithdrawal"] as? Number)?.toDouble() ?: 0.0,
                        totalCallMinutes = (data["totalCallMinutes"] as? Number)?.toInt() ?: 0,
                        weeklyCallMinutes = (data["weeklyCallMinutes"] as? Number)?.toInt() ?: 0,
                        updatedAt = (data["updatedAt"] as? com.google.firebase.Timestamp)?.toDate() ?: Date()
                    )
                    trySend(Result.success(earnings))
                }
            }
        awaitClose { listener.remove() }
    }

    private val functions = com.google.firebase.functions.FirebaseFunctions.getInstance("asia-south1")

    suspend fun requestWithdrawal(hostId: String, amount: Double, upiId: String): Result<Unit> {
        return try {
            val data = hashMapOf(
                "amount" to amount,
                "upiId" to upiId
            )
            functions.getHttpsCallable("requestWithdrawal").call(data).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun getWithdrawalHistory(hostId: String): Flow<Result<List<WithdrawalRequest>>> = callbackFlow {
        val listener = firestore.collection("hosts").document(hostId)
            .collection("payoutHistory")
            .orderBy("requestedAt", Query.Direction.DESCENDING)
            .limit(50)
            .addSnapshotListener { snap, error ->
                if (error != null) {
                    trySend(Result.failure(error))
                    return@addSnapshotListener
                }
                val requests = snap?.documents?.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    WithdrawalRequest(
                        id = doc.id,
                        hostId = hostId,
                        amount = (data["amount"] as? Number)?.toDouble() ?: 0.0,
                        upiId = data["upiId"] as? String ?: "",
                        status = data["status"] as? String ?: "pending",
                        requestedAt = (data["requestedAt"] as? com.google.firebase.Timestamp)?.toDate() ?: Date(),
                        processedAt = (data["processedAt"] as? com.google.firebase.Timestamp)?.toDate()
                    )
                } ?: emptyList()
                trySend(Result.success(requests))
            }
        awaitClose { listener.remove() }
    }
}
