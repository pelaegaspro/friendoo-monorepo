package com.friendoo.app.core.payment

import android.util.Log
import androidx.activity.ComponentActivity
import com.cashfree.pg.core.api.CFSession
import com.cashfree.pg.core.api.callback.CFCheckoutResponseCallback
import com.cashfree.pg.core.api.exception.CFException
import com.cashfree.pg.core.api.webcheckout.CFWebCheckoutPayment
import com.cashfree.pg.core.api.webcheckout.CFWebCheckoutTheme
import com.cashfree.pg.api.CFPaymentGatewayService
import com.friendoo.app.BuildConfig
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CashfreeManager @Inject constructor(
    private val callbackRegistry: CashfreePaymentCallbackRegistry
) {

    fun startPayment(
        activity: ComponentActivity,
        orderId: String,
        paymentSessionId: String,
        callback: CFCheckoutResponseCallback
    ): Boolean {
        if (BuildConfig.CASHFREE_APP_ID.isBlank()) {
            Log.e("Cashfree", "CASHFREE_APP_ID is missing — add it to local.properties")
            notifyFailure(callback, orderId)
            return false
        }

        return try {
            val environment = if (BuildConfig.CASHFREE_USE_SANDBOX) {
                CFSession.Environment.SANDBOX
            } else {
                CFSession.Environment.PRODUCTION
            }

            val session = CFSession.CFSessionBuilder()
                .setOrderId(orderId)
                .setPaymentSessionID(paymentSessionId)
                .setEnvironment(environment)
                .build()

            val theme = CFWebCheckoutTheme.CFWebCheckoutThemeBuilder()
                .setNavigationBarBackgroundColor("#7C6BFF")
                .setNavigationBarTextColor("#FFFFFF")
                .build()

            val cfWebCheckoutPayment = CFWebCheckoutPayment.CFWebCheckoutPaymentBuilder()
                .setSession(session)
                .setCFWebCheckoutUITheme(theme)
                .build()

            callbackRegistry.callback = callback
            CFPaymentGatewayService.getInstance().doPayment(activity, cfWebCheckoutPayment)
            true
        } catch (e: CFException) {
            Log.e("Cashfree", "Payment initiation failed: ${e.message}", e)
            callbackRegistry.callback = null
            notifyFailure(callback, orderId)
            false
        }
    }

    private fun notifyFailure(callback: CFCheckoutResponseCallback, orderId: String) {
        callback.onPaymentFailure(null, orderId)
    }
}
