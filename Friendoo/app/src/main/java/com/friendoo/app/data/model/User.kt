package com.friendoo.app.data.model

import com.google.firebase.Timestamp

data class User(
    val uid: String = "",
    val phoneNumber: String = "",
    val alias: String = "", // Added alias for anonymity
    val avatarColor: String = "#6200EE", // Hex color for anonymous avatar
    val bio: String = "",
    val age: Int = 0,
    val gender: String = "",
    val city: String = "",
    val languages: List<String> = emptyList(),
    val interests: List<String> = emptyList(),
    val coins: Int = 0,
    val isHost: Boolean = false,
    val createdAt: Timestamp? = null
) {
    companion object {
        fun fromMap(map: Map<String, Any?>): User = User(
            uid = map["uid"] as? String ?: "",
            phoneNumber = map["phoneNumber"] as? String ?: "",
            alias = map["alias"] as? String ?: "",
            avatarColor = map["avatarColor"] as? String ?: "#6200EE",
            bio = map["bio"] as? String ?: "",
            age = (map["age"] as? Number)?.toInt() ?: 0,
            gender = map["gender"] as? String ?: "",
            city = map["city"] as? String ?: "",
            languages = (map["languages"] as? List<*>)?.filterIsInstance<String>() ?: emptyList(),
            interests = (map["interests"] as? List<*>)?.filterIsInstance<String>() ?: emptyList(),
            coins = (map["coins"] as? Number)?.toInt() ?: 0,
            isHost = map["isHost"] as? Boolean ?: false,
            createdAt = map["createdAt"] as? Timestamp
        )
    }
    fun toMap(): Map<String, Any?> = mapOf(
        "uid" to uid,
        "phoneNumber" to phoneNumber,
        "alias" to alias,
        "avatarColor" to avatarColor,
        "bio" to bio,
        "age" to age,
        "gender" to gender,
        "city" to city,
        "languages" to languages,
        "interests" to interests,
        "coins" to coins,
        "isHost" to isHost,
        "createdAt" to createdAt
    )
}
