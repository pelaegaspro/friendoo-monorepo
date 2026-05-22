package com.friendoo.app.domain.usecase

import com.friendoo.app.core.model.CallType
import com.friendoo.app.data.repository.AgoraCredentials
import com.friendoo.app.data.repository.CallRepository
import javax.inject.Inject

data class CallInitResult(
    val callId: String,
    val ratePerMinute: Int = 5,
    val credentials: AgoraCredentials
)

/**
 * Caller flow: server creates ringing call + locks host, then fetches Agora token only after host accepts.
 * For outbound, token is fetched when host has accepted (discover flow waits on host accept via separate path).
 */
class InitiateCallUseCase @Inject constructor(
    private val callRepository: CallRepository
) {
    /** Step 1 only — creates ringing call on server. */
    suspend fun createRingingCall(
        receiverId: String,
        callType: CallType = CallType.AUDIO
    ): Result<CallInitResult> {
        return callRepository.initiateCall(receiverId, callType)
    }

    /** Step 2 — after host accepts, caller joins. */
    suspend fun joinAfterAccept(callId: String): Result<CallInitResult> {
        return callRepository.getJoinCredentials(callId)
    }
}
