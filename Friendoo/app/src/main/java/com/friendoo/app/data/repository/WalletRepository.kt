package com.friendoo.app.data.repository

import com.friendoo.app.data.remote.firebase.FirebaseFunctionsSource
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WalletRepository @Inject constructor(
    private val functionsSource: FirebaseFunctionsSource
) {
    // Payment crediting is now handled by the Cashfree webhook.
    // The WalletViewModel directly calls createCashfreeOrder and polls for balance updates.
}
