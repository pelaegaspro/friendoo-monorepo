package com.friendoo.app.data.remote.firebase

import javax.inject.Inject
import javax.inject.Singleton

/**
 * Stub Firebase Functions Source - Firebase dependencies removed
 */
@Singleton
class FirebaseFunctionsSource @Inject constructor() {
    suspend fun callGetAgoraToken(channelName: String, uid: Int): Result<Map<String, Any?>> {
        return Result.success(mapOf("token" to "stub-token"))
    }

    suspend fun callDeductCoins(userId: String, amount: Int, callId: String): Result<Map<String, Any?>> {
        return Result.success(mapOf("success" to true))
    }

    suspend fun callRechargeWallet(userId: String, amount: Int, paymentId: String): Result<Map<String, Any?>> {
        return Result.success(mapOf("success" to true))
    }

    suspend fun callCreateCashfreeOrder(amount: Double): Result<Map<String, Any?>> {
        return Result.success(mapOf("orderId" to "stub-order", "sessionId" to "stub-session"))
    }
}
