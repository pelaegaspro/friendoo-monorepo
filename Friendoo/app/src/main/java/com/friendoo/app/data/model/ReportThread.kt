package com.friendoo.app.data.model

import java.text.SimpleDateFormat
import java.util.*

data class Report(
    val id: String = "",
    val reportedId: String = "",
    val reportedAlias: String = "",
    val reporterId: String = "",
    val reason: String = "",
    val status: String = "pending", // "pending" | "under_review" | "resolved" | "rejected"
    val timestamp: String = "",
    val reportType: String = ""
)

data class ReportMessage(
    val id: String = "",
    val text: String = "",
    val senderType: String = "user", // "user" or "admin"
    val createdAt: String = "",
    val deliveredAt: String = "",
    val readAt: String = ""
)

fun String.toFormattedTime(): String {
    if (this.isEmpty()) return ""
    return try {
        val sdf = SimpleDateFormat("hh:mm a", Locale.getDefault())
        val date = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault()).parse(this)
        sdf.format(date ?: Date())
    } catch (e: Exception) {
        this
    }
}
