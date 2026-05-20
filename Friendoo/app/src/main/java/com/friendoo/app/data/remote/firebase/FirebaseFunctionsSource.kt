package com.friendoo.app.data.remote.firebase

import com.google.firebase.functions.FirebaseFunctions
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FirebaseFunctionsSource @Inject constructor() {

    private val functions = FirebaseFunctions.getInstance("asia-south1")

    /**
     * Creates a Cashfree payment order for a coin package.
     * Returns { orderId, paymentSessionId, amount, coins }
     */
    suspend fun callCreateCashfreeOrder(packageId: String, userId: String): Result<Map<String, Any?>> {
        return try {
            val data = hashMapOf(
                "packageId" to packageId,
                "userId" to userId
            )
            val result = functions
                .getHttpsCallable("createCashfreeOrder")
                .call(data)
                .await()
            @Suppress("UNCHECKED_CAST")
            Result.success(result.data as Map<String, Any?>)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun callGetAgoraToken(callId: String): Result<Map<String, Any?>> {
        return try {
            val data = hashMapOf("callId" to callId)
            val result = functions
                .getHttpsCallable("getAgoraToken")
                .call(data)
                .await()
            @Suppress("UNCHECKED_CAST")
            Result.success(result.data as Map<String, Any?>)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun callDeductCallCoins(userId: String, amount: Int, callId: String, callType: String = "audio"): Result<Map<String, Any?>> {
        return try {
            val data = hashMapOf(
                "hostId" to userId,
                "amount" to amount,
                "callId" to callId,
                "callType" to callType
            )
            val result = functions
                .getHttpsCallable("deductCallCoins")
                .call(data)
                .await()
            @Suppress("UNCHECKED_CAST")
            Result.success(result.data as Map<String, Any?>)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
