package com.friendoo.app.data.repository

import com.friendoo.app.data.model.Host
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.firestore.Source
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class HostRepository @Inject constructor(
    private val firestore: FirebaseFirestore
) {
    suspend fun getHosts(): Result<List<Host>> {
        return getHostsByLanguage(null)
    }

    suspend fun getHostsByLanguage(languageCode: String?, limit: Long = 20): Result<List<Host>> {
        return try {
            val snap = try {
                var query = firestore.collection("hosts")
                    .whereEqualTo("discoverable", true)
                if (!languageCode.isNullOrBlank()) {
                    query = query.whereEqualTo("primaryLanguage", languageCode)
                }
                val q = query.orderBy("avgRating", Query.Direction.DESCENDING).limit(limit)
                try {
                    val cacheSnap = q.get(Source.CACHE).await()
                    if (!cacheSnap.isEmpty) cacheSnap else q.get(Source.SERVER).await()
                } catch (e: Exception) {
                    q.get(Source.SERVER).await()
                }
            } catch (_: Exception) {
                val fbQuery = firestore.collection("hosts")
                    .orderBy("isOnline", Query.Direction.DESCENDING)
                    .limit(limit)
                try {
                    val cacheSnap = fbQuery.get(Source.CACHE).await()
                    if (!cacheSnap.isEmpty) cacheSnap else fbQuery.get(Source.SERVER).await()
                } catch (e: Exception) {
                    fbQuery.get(Source.SERVER).await()
                }
            }

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
            val docRef = firestore.collection("hosts").document(hostId)
            val snap = try {
                val cacheSnap = docRef.get(Source.CACHE).await()
                if (cacheSnap.exists()) cacheSnap else docRef.get(Source.SERVER).await()
            } catch (e: Exception) {
                docRef.get(Source.SERVER).await()
            }
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
            val docRef = firestore.collection("users").document(userId)
            val userSnap = try {
                val cacheSnap = docRef.get(Source.CACHE).await()
                if (cacheSnap.exists()) cacheSnap else docRef.get(Source.SERVER).await()
            } catch (e: Exception) {
                docRef.get(Source.SERVER).await()
            }
            val isHost = userSnap.getBoolean("isHost") ?: false
            Result.success(isHost)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
