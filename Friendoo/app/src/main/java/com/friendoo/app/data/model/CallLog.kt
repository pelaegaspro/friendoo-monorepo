package com.friendoo.app.data.model

import com.google.firebase.Timestamp

data class CallLog(
    val id: String = "",
    val callerId: String = "",
    val receiverId: String = "",
    val durationSeconds: Int = 0,
    val costCoins: Int = 0,
    val startedAt: Timestamp? = null,
    val endedAt: Timestamp? = null,
    val status: String = "ended"
) {
    companion object {
        fun fromMap(map: Map<String, Any?>): CallLog = CallLog(
            id = map["id"] as? String ?: "",
            callerId = map["callerId"] as? String ?: "",
            receiverId = map["receiverId"] as? String ?: "",
            durationSeconds = (map["durationSeconds"] as? Number)?.toInt() ?: 0,
            costCoins = (map["costCoins"] as? Number)?.toInt() ?: 0,
            startedAt = map["startedAt"] as? Timestamp,
            endedAt = map["endedAt"] as? Timestamp,
            status = map["status"] as? String ?: "ended"
        )
    }
    fun toMap(): Map<String, Any?> = mapOf(
        "id" to id,
        "callerId" to callerId,
        "receiverId" to receiverId,
        "durationSeconds" to durationSeconds,
        "costCoins" to costCoins,
        "startedAt" to startedAt,
        "endedAt" to endedAt,
        "status" to status
    )
}
