package com.friendoo.app.data.model

import com.google.firebase.Timestamp

data class ChatMessage(
    val id: String = "",
    val senderId: String = "",
    val receiverId: String = "",
    val text: String = "",
    val imageUrl: String = "",
    val timestamp: Timestamp? = null,
    val isRead: Boolean = false,
    val type: String = "text"
) {
    companion object {
        fun fromMap(map: Map<String, Any?>): ChatMessage = ChatMessage(
            id = map["id"] as? String ?: "",
            senderId = map["senderId"] as? String ?: "",
            receiverId = map["receiverId"] as? String ?: "",
            text = map["text"] as? String ?: "",
            imageUrl = map["imageUrl"] as? String ?: "",
            timestamp = map["timestamp"] as? Timestamp,
            isRead = map["isRead"] as? Boolean ?: false,
            type = map["type"] as? String ?: "text"
        )
    }
    fun toMap(): Map<String, Any?> = mapOf(
        "id" to id,
        "senderId" to senderId,
        "receiverId" to receiverId,
        "text" to text,
        "imageUrl" to imageUrl,
        "timestamp" to timestamp,
        "isRead" to isRead,
        "type" to type
    )
}
