package com.friendoo.app.data.model

import com.google.firebase.Timestamp

data class WalletTransaction(
    val id: String = "",
    val userId: String = "",
    val type: String = "recharge", // recharge, spend, earn
    val amount: Int = 0,
    val description: String = "",
    val timestamp: Timestamp? = null,
    val paymentId: String = ""
) {
    companion object {
        fun fromMap(map: Map<String, Any?>): WalletTransaction = WalletTransaction(
            id = map["id"] as? String ?: "",
            userId = map["userId"] as? String ?: "",
            type = map["type"] as? String ?: "recharge",
            amount = (map["amount"] as? Number)?.toInt() ?: 0,
            description = map["description"] as? String ?: "",
            timestamp = map["timestamp"] as? Timestamp,
            paymentId = map["paymentId"] as? String ?: ""
        )
    }
    fun toMap(): Map<String, Any?> = mapOf(
        "id" to id,
        "userId" to userId,
        "type" to type,
        "amount" to amount,
        "description" to description,
        "timestamp" to timestamp,
        "paymentId" to paymentId
    )
}
