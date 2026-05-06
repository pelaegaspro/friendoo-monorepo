package com.friendoo.app.data.model

import com.google.firebase.Timestamp

data class FriendRequest(
    val id: String = "",
    val fromUserId: String = "",
    val toUserId: String = "",
    val status: String = "pending", // pending, accepted, rejected
    val timestamp: Timestamp? = null
) {
    companion object {
        fun fromMap(map: Map<String, Any?>): FriendRequest = FriendRequest(
            id = map["id"] as? String ?: "",
            fromUserId = map["fromUserId"] as? String ?: "",
            toUserId = map["toUserId"] as? String ?: "",
            status = map["status"] as? String ?: "pending",
            timestamp = map["timestamp"] as? Timestamp
        )
    }
    fun toMap(): Map<String, Any?> = mapOf(
        "id" to id,
        "fromUserId" to fromUserId,
        "toUserId" to toUserId,
        "status" to status,
        "timestamp" to timestamp
    )
}
