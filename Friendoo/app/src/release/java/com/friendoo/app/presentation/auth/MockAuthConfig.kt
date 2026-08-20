package com.friendoo.app.presentation.auth

/** Release variants never accept a local mock phone number or OTP. */
object MockAuthConfig {
    fun isMockPhone(phone: String): Boolean = false
    fun isMockOtp(code: String): Boolean = false
}