package com.friendoo.app.data.remote.firebase

import com.google.firebase.functions.FirebaseFunctions
import kotlinx.coroutines.tasks.await
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FirebaseFunctionsSource @Inject constructor(
    private val functions: FirebaseFunctions
) {
    suspend fun callGetAgoraToken(channelName: String, uid: Int): Result<Map<String, Any?>> {
        return try {
            val data = hashMapOf(
                "channelName" to channelName,
                "uid" to uid
            )
            val result = functions.getHttpsCallable("getAgoraToken")
                .withTimeout(15, TimeUnit.SECONDS)
                .call(data)
                .await()
            
            @Suppress("UNCHECKED_CAST")
            val resultMap = result.data as? Map<String, Any?> ?: emptyMap()
            Result.success(resultMap)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun callDeductCoins(userId: String, amount: Int, callId: String): Result<Map<String, Any?>> {
        return try {
            val data = hashMapOf(
                "userId" to userId,
                "amount" to amount,
                "callId" to callId
            )
            val result = functions.getHttpsCallable("deductCoins")
                .withTimeout(15, TimeUnit.SECONDS)
                .call(data)
                .await()
            
            @Suppress("UNCHECKED_CAST")
            val resultMap = result.data as? Map<String, Any?> ?: emptyMap()
            Result.success(resultMap)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun callRechargeWallet(userId: String, amount: Int, paymentId: String): Result<Map<String, Any?>> {
        return try {
            val data = hashMapOf(
                "userId" to userId,
                "amount" to amount,
                "paymentId" to paymentId
            )
            val result = functions.getHttpsCallable("rechargeWallet")
                .withTimeout(15, TimeUnit.SECONDS)
                .call(data)
                .await()
            
            @Suppress("UNCHECKED_CAST")
            val resultMap = result.data as? Map<String, Any?> ?: emptyMap()
            Result.success(resultMap)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun callCreateCashfreeOrder(amount: Double): Result<Map<String, Any?>> {
        return try {
            val data = hashMapOf("amount" to amount)
            val result = functions.getHttpsCallable("createCashfreeOrder")
                .withTimeout(15, TimeUnit.SECONDS)
                .call(data)
                .await()
            
            @Suppress("UNCHECKED_CAST")
            val resultMap = result.data as? Map<String, Any?> ?: emptyMap()
            Result.success(resultMap)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
