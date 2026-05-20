package com.friendoo.app.core.model

enum class CallType(val value: String) {
    AUDIO("audio"),
    VIDEO("video");

    companion object {
        fun fromString(value: String): CallType =
            entries.firstOrNull { it.value == value } ?: AUDIO
    }
}
