package com.friendoo.app.presentation.auth

/**
 * Development-only local login credentials for navigating UI without sending an SMS.
 * This file is compiled only into debug variants.
 */
object MockAuthConfig {
    const val phoneNumber: String = "+919000000000"
    const val otp: String = ""

    fun isMockPhone(phone: String): Boolean = false
    fun isMockOtp(code: String): Boolean = false
}
