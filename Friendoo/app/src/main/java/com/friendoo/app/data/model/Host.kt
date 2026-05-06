package com.friendoo.app.data.model

data class Host(
    val uid: String = "",
    val alias: String = "",
    val avatarColor: String = "#3700B3",
    val bio: String = "",
    val ageGroup: String? = null,
    val vibeTags: List<String>? = null,
    val isStarHost: Boolean? = false,
    val starRank: Int? = null,
    val starLanguage: String? = null,
    val avgRating: Double? = 5.0,
    val ratingCount: Int? = 0,
    val ratePerAudioMinute: Int = 5,
    val languages: List<String> = emptyList(),
    val isOnline: Boolean = false,
    val callStatus: String = "offline", // available, busy, offline
    val totalCalls: Int = 0
) {
    companion object {
        fun fromMap(map: Map<String, Any?>): Host = Host(
            uid = map["uid"] as? String ?: "",
            alias = map["alias"] as? String ?: "",
            avatarColor = map["avatarColor"] as? String ?: "#3700B3",
            bio = map["bio"] as? String ?: "",
            ageGroup = map["ageGroup"] as? String,
            vibeTags = (map["vibeTags"] as? List<*>)?.filterIsInstance<String>(),
            isStarHost = map["isStarHost"] as? Boolean,
            starRank = (map["starRank"] as? Number)?.toInt(),
            starLanguage = map["starLanguage"] as? String,
            avgRating = (map["avgRating"] as? Number)?.toDouble() ?: 5.0,
            ratingCount = (map["ratingCount"] as? Number)?.toInt() ?: 0,
            ratePerAudioMinute = (map["ratePerAudioMinute"] as? Number)?.toInt() ?: 5,
            languages = (map["languages"] as? List<*>)?.filterIsInstance<String>() ?: emptyList(),
            isOnline = map["isOnline"] as? Boolean ?: false,
            callStatus = map["callStatus"] as? String ?: "offline",
            totalCalls = (map["totalCalls"] as? Number)?.toInt() ?: 0
        )
    }
}
