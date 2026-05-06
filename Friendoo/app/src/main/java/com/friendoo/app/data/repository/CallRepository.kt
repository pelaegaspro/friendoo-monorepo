package com.friendoo.app.data.repository

import com.friendoo.app.data.remote.firebase.FirebaseFunctionsSource
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CallRepository @Inject constructor(
    private val functionsSource: FirebaseFunctionsSource
) {
    suspend fun getAgoraToken(channelName: String, uid: Int): Result<String> {
        return functionsSource.callGetAgoraToken(channelName, uid).map {
            it["token"] as? String ?: ""
        }
    }

    suspend fun deductCoins(userId: String, amount: Int, callId: String): Result<Boolean> {
        return functionsSource.callDeductCoins(userId, amount, callId).map {
            it["success"] as? Boolean ?: false
        }
    }
}
