package com.friendoo.app.core.payment

import android.content.Context
import com.cashfree.pg.api.CFPaymentGatewayService
import com.cashfree.pg.core.api.CFSession
import com.cashfree.pg.core.api.CFTheme
import com.cashfree.pg.core.api.callback.CFCheckoutResponseCallback
import com.cashfree.pg.core.api.exception.CFException
import com.cashfree.pg.core.api.utils.CFComponents
import com.cashfree.pg.ui.api.CFDropCheckoutPayment
import com.cashfree.pg.ui.api.CFPaymentGatewayService as CFPGService
import com.friendoo.app.core.utils.Constants
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
            val session = CFSession.CFSessionBuilder()
                .setOrderId(orderId)
                .setPaymentSessionId(paymentSessionId)
                .setEnvironment(CFSession.CFSessionEnvironment.SANDBOX) // Change to PRODUCTION for live
                .build()

            val theme = CFTheme.CFThemeBuilder()
                .setNavigationBarBackgroundColor("#6200EE")
                .setNavigationBarTextColor("#FFFFFF")
                .setButtonBackgroundColor("#6200EE")
                .setButtonTextColor("#FFFFFF")
                .setPrimaryTextColor("#000000")
                .setSecondaryTextColor("#000000")
                .build()

            val cfComponents = CFComponents.CFComponentsBuilder()
                .add(CFComponents.CFComponent.UPI)
                .add(CFComponents.CFComponent.CARD)
                .build()

            val cfDropCheckoutPayment = CFDropCheckoutPayment.CFDropCheckoutPaymentBuilder()
                .setSession(session)
                .setCFTheme(theme)
                .setCFComponents(cfComponents)
                .build()

            val gatewayService = CFPGService.getInstance()
            gatewayService.setCheckoutCallback(callback)
            gatewayService.doPayment(context, cfDropCheckoutPayment)
        } catch (e: CFException) {
            e.printStackTrace()
        }
    }
}
