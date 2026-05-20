package com.friendoo.app.data.repository

import com.friendoo.app.data.model.Host
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class HostRepository @Inject constructor(
    private val firestore: FirebaseFirestore
) {
    suspend fun getHosts(): Result<List<Host>> {
        return try {
            val snap = firestore.collection("hosts")
                .orderBy("isOnline", Query.Direction.DESCENDING)
                .limit(50)
                .get()
                .await()

            val hosts = snap.documents.mapNotNull { doc ->
                val data = doc.data ?: return@mapNotNull null
                Host.fromMap(data + ("uid" to doc.id))
            }
            Result.success(hosts)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getHostById(hostId: String): Result<Host?> {
        return try {
            val snap = firestore.collection("hosts").document(hostId).get().await()
            if (snap.exists()) {
                val data = snap.data ?: return Result.success(null)
                Result.success(Host.fromMap(data + ("uid" to snap.id)))
            } else {
                Result.success(null)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Check if a user is a host (same UID in both collections)
     */
    suspend fun isUserHost(userId: String): Result<Boolean> {
        return try {
            val userSnap = firestore.collection("users").document(userId).get().await()
            val isHost = userSnap.getBoolean("isHost") ?: false
            Result.success(isHost)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
