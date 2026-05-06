package com.friendoo.app.data.repository

import com.friendoo.app.data.remote.firebase.FirebaseFunctionsSource
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WalletRepository @Inject constructor(
    private val functionsSource: FirebaseFunctionsSource
) {
    suspend fun rechargeWallet(userId: String, amount: Int, paymentId: String): Result<Boolean> {
        return functionsSource.callRechargeWallet(userId, amount, paymentId).map {
            it["success"] as? Boolean ?: false
        }
    }
}
