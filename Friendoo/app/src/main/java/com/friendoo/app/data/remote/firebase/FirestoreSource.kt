package com.friendoo.app.data.remote.firebase

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FirestoreSource @Inject constructor(
    private val firestore: FirebaseFirestore
) {
    suspend fun getDocument(collection: String, docId: String): Result<Map<String, Any?>> {
        return try {
            val snap = firestore.collection(collection).document(docId).get().await()
            if (snap.exists()) {
                Result.success(snap.data ?: emptyMap())
            } else {
                Result.success(emptyMap())
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun setDocument(collection: String, docId: String, data: Map<String, Any?>): Result<Unit> {
        return try {
            firestore.collection(collection).document(docId).set(data).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateDocument(collection: String, docId: String, data: Map<String, Any?>): Result<Unit> {
        return try {
            firestore.collection(collection).document(docId).update(data).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getCollection(collection: String): Result<List<Map<String, Any?>>> {
        return try {
            val snap = firestore.collection(collection).get().await()
            Result.success(snap.documents.map { it.data ?: emptyMap() })
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun addDocument(collection: String, data: Map<String, Any?>): Result<String> {
        return try {
            val ref = firestore.collection(collection).add(data).await()
            Result.success(ref.id)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteDocument(collection: String, docId: String): Result<Unit> {
        return try {
            firestore.collection(collection).document(docId).delete().await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun addSnapshotListener(collection: String, docId: String): Flow<Map<String, Any?>> = callbackFlow {
        val listener: ListenerRegistration = firestore.collection(collection).document(docId)
            .addSnapshotListener { snap, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                trySend(snap?.data ?: emptyMap())
            }
        awaitClose { listener.remove() }
    }

    fun addCollectionSnapshotListener(collection: String): Flow<List<Map<String, Any?>>> = callbackFlow {
        val listener: ListenerRegistration = firestore.collection(collection)
            .addSnapshotListener { snap, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                trySend(snap?.documents?.map { it.data ?: emptyMap() } ?: emptyList())
            }
        awaitClose { listener.remove() }
    }
}
