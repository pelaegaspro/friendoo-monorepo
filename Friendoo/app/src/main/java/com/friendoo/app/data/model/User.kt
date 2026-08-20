package com.friendoo.app.data.model

data class User(
    val uid: String = "",
    val displayName: String = "",
    val avatarSeed: String = "",
    val avatarUrl: String = "",
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
    val accountType: String = "user",
    val onboardingCompleted: Boolean = false,
    val avatarConfig: Map<String, String> = emptyMap(),
    val avatarVersion: Int = 1,
    val createdAt: String = ""
) {
    companion object {
        fun fromMap(map: Map<String, Any?>): User {
            val uid = map["uid"] as? String ?: ""
            val isHost = map["isHost"] as? Boolean
                ?: (map["accountType"] as? String).equals("host", ignoreCase = true)
            return User(
                uid = uid,
                displayName = map["displayName"] as? String ?: map["alias"] as? String ?: "",
                avatarSeed = map["avatarSeed"] as? String ?: uid,
                avatarUrl = map["avatarUrl"] as? String ?: "",
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
                isHost = isHost,
                accountType = map["accountType"] as? String ?: if (isHost) "host" else "user",
                onboardingCompleted = map["onboardingCompleted"] as? Boolean
                    ?: map["onboardingComplete"] as? Boolean
                    ?: false,
                avatarConfig = (map["avatarConfig"] as? Map<*, *>)?.map { it.key.toString() to it.value.toString() }?.toMap() ?: emptyMap(),
                avatarVersion = (map["avatarVersion"] as? Number)?.toInt() ?: 1,
                createdAt = map["createdAt"] as? String ?: ""
            )
        }
    }
    fun toMap(): Map<String, Any?> = mapOf(
        "uid" to uid,
        "displayName" to displayName,
        "avatarSeed" to avatarSeed,
        "avatarUrl" to avatarUrl,
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
        "accountType" to accountType,
        "onboardingCompleted" to onboardingCompleted,
        "avatarConfig" to avatarConfig,
        "avatarVersion" to avatarVersion,
        "createdAt" to createdAt
    )
}
