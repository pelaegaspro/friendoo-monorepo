package com.friendoo.app.data.remote.firebase



import com.google.firebase.functions.FirebaseFunctions

import com.google.firebase.functions.FirebaseFunctionsException

import kotlinx.coroutines.tasks.await

import javax.inject.Inject

import javax.inject.Singleton



@Singleton

class FirebaseFunctionsSource @Inject constructor() {



    private val functions = FirebaseFunctions.getInstance("asia-south1")



    private suspend fun callFunction(

        name: String,

        data: Map<String, Any>

    ): Result<Map<String, Any?>> {

        return try {

            val result = functions.getHttpsCallable(name).call(data).await()

            @Suppress("UNCHECKED_CAST")

            Result.success(result.data as Map<String, Any?>)

        } catch (e: FirebaseFunctionsException) {

            val message = e.message ?: when (e.code) {

                FirebaseFunctionsException.Code.UNAUTHENTICATED -> "Please sign in again"

                FirebaseFunctionsException.Code.FAILED_PRECONDITION -> e.message ?: "Request not allowed"

                FirebaseFunctionsException.Code.PERMISSION_DENIED -> "Permission denied"

                FirebaseFunctionsException.Code.NOT_FOUND -> "Not found"

                else -> "Request failed"

            }

            Result.failure(Exception(message, e))

        } catch (e: Exception) {

            Result.failure(e)

        }

    }



    suspend fun callCreateCashfreeOrder(

        packageId: String,

        userId: String,

        useSandbox: Boolean = false

    ): Result<Map<String, Any?>> {

        val data = hashMapOf<String, Any>(

            "packageId" to packageId,

            "userId" to userId

        )

        if (useSandbox) data["cashfreeEnv"] = "sandbox"

        return callFunction("createCashfreeOrder", data)

    }



    suspend fun callConfirmCashfreePayment(

        orderId: String,

        userId: String,

        useSandbox: Boolean = false

    ): Result<Map<String, Any?>> {

        val data = hashMapOf<String, Any>(

            "orderId" to orderId,

            "userId" to userId

        )

        if (useSandbox) data["cashfreeEnv"] = "sandbox"

        return callFunction("confirmCashfreePayment", data)

    }



    suspend fun callInitiateCall(hostId: String, callType: String): Result<Map<String, Any?>> {

        return callFunction(

            "initiateCall",

            hashMapOf("hostId" to hostId, "callType" to callType)

        )

    }



    suspend fun callAcceptCall(callId: String): Result<Map<String, Any?>> {

        return callFunction("acceptCall", hashMapOf("callId" to callId))

    }



    suspend fun callRejectCall(callId: String, reason: String): Result<Map<String, Any?>> {

        return callFunction("rejectCall", hashMapOf("callId" to callId, "reason" to reason))

    }



    suspend fun callMarkCallActive(callId: String): Result<Map<String, Any?>> {

        return callFunction("markCallActive", hashMapOf("callId" to callId))

    }



    suspend fun callEndCall(callId: String, reason: String = "user_hangup"): Result<Map<String, Any?>> {

        return callFunction("endCall", hashMapOf("callId" to callId, "reason" to reason))

    }



    suspend fun callGetAgoraToken(callId: String): Result<Map<String, Any?>> {

        return callFunction("getAgoraToken", hashMapOf("callId" to callId))

    }



    suspend fun callPresenceHeartbeat(deviceId: String, workModeOnline: Boolean): Result<Map<String, Any?>> {
        return callFunction(
            "presenceHeartbeat",
            hashMapOf(
                "deviceId" to deviceId,
                "workModeOnline" to workModeOnline
            )
        )
    }

    suspend fun callCompleteUserOnboarding(
        displayName: String,
        avatarUrl: String,
        avatarSeed: String,
        avatarConfig: Map<String, Any>,
        avatarVersion: Int,
        gender: String
    ): Result<Map<String, Any?>> {
        return callFunction(
            "completeUserOnboarding",
            hashMapOf(
                "displayName" to displayName,
                "avatarUrl" to avatarUrl,
                "avatarSeed" to avatarSeed,
                "avatarConfig" to avatarConfig,
                "avatarVersion" to avatarVersion,
                "gender" to gender
            )
        )
    }
}

