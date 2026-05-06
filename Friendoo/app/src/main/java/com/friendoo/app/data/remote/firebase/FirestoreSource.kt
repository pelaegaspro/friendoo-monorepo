package com.friendoo.app.data.remote.firebase

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FirestoreSource @Inject constructor(
    private val firestore: FirebaseFirestore
) {
    suspend fun getDocument(collection: String, docId: String): Result<Map<String, Any?>> {
        return try {
            val doc = firestore.collection(collection).doc(docId).get().await()
            if (doc.exists()) {
                Result.success(doc.data ?: emptyMap())
            } else {
                Result.failure(Exception("Document does not exist"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun setDocument(collection: String, docId: String, data: Map<String, Any?>): Result<Unit> {
        return try {
            firestore.collection(collection).doc(docId).set(data).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getCollection(collection: String, query: Query? = null): Result<List<Map<String, Any?>>> {
        return try {
            val q = query ?: firestore.collection(collection)
            val snapshot = q.get().await()
            Result.success(snapshot.documents.mapNotNull { it.data })
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun addSnapshotListener(collection: String, docId: String): Flow<Map<String, Any?>> = callbackFlow {
        val listener = firestore.collection(collection).doc(docId).addSnapshotListener { snapshot, error ->
            if (error != null) {
                close(error)
                return@addSnapshotListener
            }
            if (snapshot != null && snapshot.exists()) {
                trySend(snapshot.data ?: emptyMap())
            }
        }
        awaitClose { listener.remove() }
    }

    fun addCollectionSnapshotListener(collection: String, query: Query? = null): Flow<List<Map<String, Any?>>> = callbackFlow {
        val q = query ?: firestore.collection(collection)
        val listener = q.addSnapshotListener { snapshot, error ->
            if (error != null) {
                close(error)
                return@addSnapshotListener
            }
            if (snapshot != null) {
                trySend(snapshot.documents.mapNotNull { it.data })
            }
        }
        awaitClose { listener.remove() }
    }
}
