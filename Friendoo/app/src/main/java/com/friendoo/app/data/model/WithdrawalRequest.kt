package com.friendoo.app.data.model

import com.google.firebase.Timestamp

data class WithdrawalRequest(
    val id: String = "",
    val hostId: String = "",
    val amount: Double = 0.0,
    val upiId: String = "",
    val status: String = "pending", // pending, approved, rejected, completed, failed
    val requestedAt: Timestamp? = null,
    val processedAt: Timestamp? = null,
    val adminNote: String = "",
    val razorpayPayoutId: String? = null,
    val failureReason: String? = null
) {
    companion object {
        fun fromMap(id: String, map: Map<String, Any?>): WithdrawalRequest = WithdrawalRequest(
            id = id,
            hostId = map["hostId"] as? String ?: "",
            amount = (map["amount"] as? Number)?.toDouble() ?: 0.0,
            upiId = map["upiId"] as? String ?: "",
            status = map["status"] as? String ?: "pending",
            requestedAt = map["requestedAt"] as? Timestamp,
            processedAt = map["processedAt"] as? Timestamp,
            adminNote = map["adminNote"] as? String ?: "",
            razorpayPayoutId = map["razorpayPayoutId"] as? String,
            failureReason = map["failureReason"] as? String
        )
    }

    fun toMap(): Map<String, Any?> = mapOf(
        "hostId" to hostId,
        "amount" to amount,
        "upiId" to upiId,
        "status" to status,
        "requestedAt" to requestedAt,
        "processedAt" to processedAt,
        "adminNote" to adminNote,
        "razorpayPayoutId" to razorpayPayoutId,
        "failureReason" to failureReason
    )
}
