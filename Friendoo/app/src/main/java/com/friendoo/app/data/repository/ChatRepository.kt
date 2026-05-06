package com.friendoo.app.data.repository

import com.friendoo.app.data.model.ChatMessage
import com.friendoo.app.data.remote.firebase.FirestoreSource
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ChatRepository @Inject constructor(
    private val firestoreSource: FirestoreSource,
    private val firestore: FirebaseFirestore
) {
    fun getChatMessages(userId: String, otherUserId: String): Flow<List<ChatMessage>> {
        val chatId = getChatRoomId(userId, otherUserId)
        val query = firestore.collection("chats").document(chatId)
            .collection("messages").orderBy("timestamp")
        return firestoreSource.addCollectionSnapshotListener("chats/$chatId/messages", query)
            .map { list -> list.map { ChatMessage.fromMap(it) } }
    }

    suspend fun sendMessage(userId: String, otherUserId: String, text: String): Result<Unit> {
        val chatId = getChatRoomId(userId, otherUserId)
        val msgId = UUID.randomUUID().toString()
        val msg = ChatMessage(id = msgId, senderId = userId, receiverId = otherUserId, text = text, timestamp = com.google.firebase.Timestamp.now())
        return firestoreSource.setDocument("chats/$chatId/messages", msgId, msg.toMap())
    }

    private fun getChatRoomId(u1: String, u2: String): String {
        return if (u1 < u2) "${u1}_$u2" else "${u2}_$u1"
    }
}
