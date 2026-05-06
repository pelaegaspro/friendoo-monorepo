package com.friendoo.app.data.repository

import com.friendoo.app.data.model.HostEarnings
import com.friendoo.app.data.model.WithdrawalRequest
import com.friendoo.app.data.remote.firebase.FirestoreSource
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class HostWalletRepository @Inject constructor(
    private val firestoreSource: FirestoreSource,
    private val firestore: FirebaseFirestore
) {
    fun getHostEarnings(hostId: String): Flow<Result<HostEarnings>> {
        return firestoreSource.addSnapshotListener("hostEarnings", hostId)
            .map { Result.success(HostEarnings.fromMap(it)) }
            .catch { emit(Result.failure(it)) }
    }

    suspend fun requestWithdrawal(hostId: String, amount: Double, upiId: String): Result<Unit> {
        return try {
            val withdrawalId = UUID.randomUUID().toString()
            val request = WithdrawalRequest(
                id = withdrawalId,
                hostId = hostId,
                amount = amount,
                upiId = upiId,
                status = "pending",
                requestedAt = Timestamp.now()
            )

            // Use a transaction to ensure atomic update
            firestore.runTransaction { transaction ->
                val earningsRef = firestore.collection("hostEarnings").document(hostId)
                val earningsDoc = transaction.get(earningsRef)
                
                if (!earningsDoc.exists()) throw Exception("Host earnings record not found")
                
                val currentAvailable = earningsDoc.getDouble("availableForWithdrawal") ?: 0.0
                val currentPending = earningsDoc.getDouble("pendingWithdrawal") ?: 0.0
                
                if (currentAvailable < amount) throw Exception("Insufficient balance for withdrawal")

                // 1. Create withdrawal request
                val withdrawalRef = firestore.collection("withdrawalRequests").document(withdrawalId)
                transaction.set(withdrawalRef, request.toMap())

                // 2. Update host earnings (move available to pending)
                transaction.update(earningsRef, mapOf(
                    "availableForWithdrawal" to currentAvailable - amount,
                    "pendingWithdrawal" to currentPending + amount,
                    "updatedAt" to Timestamp.now()
                ))

                // 3. Log transaction
                val logRef = firestore.collection("hostTransactions").document()
                transaction.set(logRef, mapOf(
                    "hostId" to hostId,
                    "type" to "withdrawal",
                    "amount" to amount,
                    "description" to "Withdrawal request to $upiId",
                    "withdrawalId" to withdrawalId,
                    "balanceAfter" to currentAvailable - amount,
                    "timestamp" to Timestamp.now()
                ))
            }.await()

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun getWithdrawalHistory(hostId: String): Flow<Result<List<WithdrawalRequest>>> {
        val query = firestore.collection("withdrawalRequests")
            .whereEqualTo("hostId", hostId)
            .orderBy("requestedAt", Query.Direction.DESCENDING)
        
        return firestoreSource.addCollectionSnapshotListener("withdrawalRequests", query)
            .map { list -> 
                Result.success(list.mapIndexed { index, map -> 
                    // Note: In real app, we'd need the actual doc ID, but the query snapshot gives it
                    // For now we assume the map has the ID or we'd need to modify FirestoreSource
                    WithdrawalRequest.fromMap("", map) 
                }) 
            }
            .catch { emit(Result.failure(it)) }
    }
}
