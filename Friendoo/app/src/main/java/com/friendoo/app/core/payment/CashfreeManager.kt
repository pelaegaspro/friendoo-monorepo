package com.friendoo.app.core.payment

import android.content.Context
import android.util.Log
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
class CashfreeManager @Inject constructor() {

    fun startPayment(
        context: Context,
        orderId: String,
        paymentSessionId: String,
        callback: CFCheckoutResponseCallback
    ) {
        try {
            val environment = if (BuildConfig.DEBUG) {
                CFSession.Environment.SANDBOX
            } else {
                CFSession.Environment.PRODUCTION
            }

            val session = CFSession.CFSessionBuilder()
                .setOrderId(orderId)
                .setPaymentSessionID(paymentSessionId) // Capitalized ID
                .setEnvironment(environment)
                .build()

            val theme = CFWebCheckoutTheme.CFWebCheckoutThemeBuilder()
                .setNavigationBarBackgroundColor("#7C6BFF")   // Friendoo SoftPurple
                .setNavigationBarTextColor("#FFFFFF")
                .build()

            val cfWebCheckoutPayment = CFWebCheckoutPayment.CFWebCheckoutPaymentBuilder()
                .setSession(session)
                .setCFWebCheckoutUITheme(theme)
                .build()

            val gatewayService = CFPaymentGatewayService.getInstance()
            gatewayService.setCheckoutCallback(callback)
            gatewayService.doPayment(context, cfWebCheckoutPayment)
        } catch (e: CFException) {
            e.printStackTrace()
            Log.e("Cashfree", "Payment initiation failed: ${e.message}")
        }
    }
}
