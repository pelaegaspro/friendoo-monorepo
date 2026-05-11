package com.friendoo.app.data.remote.firebase

import com.friendoo.app.data.repository.InsForgeRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOf
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Stub FirestoreSource - replaced with InsForge API calls
 * This maintains API compatibility while using InsForge backend
 */
@Singleton
class FirestoreSource @Inject constructor(
    private val insForgeRepository: InsForgeRepository
) {
    suspend fun getDocument(collection: String, docId: String): Result<Map<String, Any?>> {
        // Stub - returns empty map
        return Result.success(emptyMap())
    }

    suspend fun setDocument(collection: String, docId: String, data: Map<String, Any?>): Result<Unit> {
        // Stub - no-op
        return Result.success(Unit)
    }

    suspend fun getCollection(collection: String, query: Any? = null): Result<List<Map<String, Any?>>> {
        // Stub - returns empty list
        return Result.success(emptyList())
    }

    fun addSnapshotListener(collection: String, docId: String): Flow<Map<String, Any?>> {
        // Stub - returns empty flow
        return flowOf(emptyMap())
    }

    fun addCollectionSnapshotListener(collection: String, query: Any? = null): Flow<List<Map<String, Any?>>> {
        // Stub - returns empty flow
        return flowOf(emptyList())
    }
}
