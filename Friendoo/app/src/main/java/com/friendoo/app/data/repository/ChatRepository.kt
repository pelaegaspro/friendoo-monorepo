package com.friendoo.app.data.repository

import com.friendoo.app.data.model.ChatMessage
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Stub Chat Repository - Firebase dependencies removed
 */
@Singleton
class ChatRepository @Inject constructor() {
    fun getChatMessages(userId: String, otherUserId: String): Flow<List<ChatMessage>> {
        return flowOf(emptyList())
    }

    suspend fun sendMessage(userId: String, otherUserId: String, text: String): Result<Unit> {
        return Result.success(Unit)
    }

    private fun getChatRoomId(u1: String, u2: String): String {
        return if (u1 < u2) "${u1}_$u2" else "${u2}_$u1"
    }
}
