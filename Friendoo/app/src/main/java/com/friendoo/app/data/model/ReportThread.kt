package com.friendoo.app.data.model

import com.google.firebase.Timestamp
import java.text.SimpleDateFormat
import java.util.*

data class Report(
    val id: String = "",
    val reportedId: String = "",
    val reportedAlias: String = "",
    val reporterId: String = "",
    val reason: String = "",
    val status: String = "pending", // "pending" | "under_review" | "resolved" | "rejected"
    val timestamp: Timestamp? = null,
    val reportType: String = ""
)

data class ReportMessage(
    val id: String = "",
    val text: String = "",
    val senderType: String = "user", // "user" or "admin"
    val createdAt: Timestamp? = null,
    val deliveredAt: Timestamp? = null,
    val readAt: Timestamp? = null
)

fun Timestamp?.toFormattedTime(): String {
    if (this == null) return ""
    val sdf = SimpleDateFormat("hh:mm a", Locale.getDefault())
    return sdf.format(this.toDate())
}
