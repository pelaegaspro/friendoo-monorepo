package com.friendoo.app.data.repository



import com.friendoo.app.core.model.CallType

import com.friendoo.app.data.remote.firebase.FirebaseFunctionsSource

import com.friendoo.app.domain.usecase.CallInitResult

import javax.inject.Inject

import javax.inject.Singleton



data class AgoraCredentials(

    val token: String,

    val appId: String,

    val channel: String

)



/**

 * Server-authoritative call operations — no direct Firestore writes.

 */

@Singleton

class CallRepository @Inject constructor(

    private val functionsSource: FirebaseFunctionsSource

) {



    suspend fun initiateCall(

        hostId: String,

        callType: CallType = CallType.AUDIO

    ): Result<CallInitResult> {

        val response = functionsSource.callInitiateCall(hostId, callType.value)

        return response.map { data ->

            val callId = data["callId"] as? String ?: throw IllegalStateException("Missing callId")

            CallInitResult(

                callId = callId,

                ratePerMinute = (data["ratePerMinute"] as? Number)?.toInt() ?: 5,

                credentials = AgoraCredentials("", "", callId)

            )

        }

    }



    suspend fun acceptIncomingCall(callId: String): Result<CallInitResult> {

        val acceptResult = functionsSource.callAcceptCall(callId)

        if (acceptResult.isFailure) return Result.failure(acceptResult.exceptionOrNull()!!)

        return getJoinCredentials(callId)

    }



    suspend fun getJoinCredentials(callId: String): Result<CallInitResult> {

        val tokenResult = getAgoraToken(callId)

        return tokenResult.map { creds ->

            CallInitResult(callId = callId, credentials = creds)

        }

    }



    suspend fun getAgoraToken(callId: String): Result<AgoraCredentials> {

        return functionsSource.callGetAgoraToken(callId).map { data ->

            AgoraCredentials(

                token = data["token"] as? String ?: "",

                appId = data["appId"] as? String ?: "",

                channel = data["channel"] as? String ?: callId

            )

        }

    }



    suspend fun markCallActive(callId: String): Result<Unit> {

        return functionsSource.callMarkCallActive(callId).map { }

    }



    suspend fun rejectCall(callId: String, reason: String) {

        functionsSource.callRejectCall(callId, reason)

    }



    suspend fun endCall(callId: String) {

        functionsSource.callEndCall(callId, "user_hangup")

    }

}

