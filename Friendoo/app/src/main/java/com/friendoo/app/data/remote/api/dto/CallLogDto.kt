package com.friendoo.app.data.remote.api.dto

data class CallLogDto(
    val id: String,
    val callerId: String,
    val receiverId: String,
    val durationSeconds: Int,
    val costCoins: Int
)
