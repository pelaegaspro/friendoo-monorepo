package com.friendoo.app.core.payment

import com.cashfree.pg.core.api.callback.CFCheckoutResponseCallback
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Holds the active checkout callback while a payment is in progress.
 * MainActivity forwards SDK events here so callbacks survive activity resume.
 */
@Singleton
class CashfreePaymentCallbackRegistry @Inject constructor() {
    @Volatile
    var callback: CFCheckoutResponseCallback? = null
}
