package com.friendoo.app.core.payment

import android.content.Context
import android.util.Log
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Stub Cashfree Manager - Cashfree SDK dependencies removed
 * In production, add Cashfree SDK and replace with actual implementation
 */
@Singleton
class CashfreeManager @Inject constructor() {

    fun startPayment(
        context: Context,
        orderId: String,
        paymentSessionId: String,
        callback: Any
    ) {
        Log.d("Cashfree", "Stub payment started for order: $orderId")
        // Stub implementation - would normally call Cashfree SDK
    }
}
