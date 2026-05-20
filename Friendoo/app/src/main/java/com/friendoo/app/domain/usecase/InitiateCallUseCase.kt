package com.friendoo.app.domain.usecase

import com.friendoo.app.core.model.CallType
import com.friendoo.app.data.repository.AgoraCredentials
import com.friendoo.app.data.repository.CallRepository
import javax.inject.Inject

/**
 * Result of initiating a call — contains everything needed to join the Agora channel.
 */
data class CallInitResult(
    val callId: String,
    val credentials: AgoraCredentials
)

/**
 * Orchestrates the full call initiation flow:
 * 1. Creates a call document in Firestore (status = "ringing")
 * 2. Requests an Agora RTC token from the Cloud Function
 * 3. Returns the credentials needed to join the Agora channel
 */
class InitiateCallUseCase @Inject constructor(
    private val callRepository: CallRepository
) {
    suspend operator fun invoke(
        receiverId: String,
        receiverAlias: String,
        ratePerMinute: Int,
        callType: CallType = CallType.AUDIO
    ): Result<CallInitResult> {
        // Step 1: Create the call document in Firestore
        val callIdResult = callRepository.createCall(receiverId, receiverAlias, ratePerMinute, callType)
        val callId = callIdResult.getOrElse { return Result.failure(it) }

        // Step 2: Request an Agora token for this call
        val credentialsResult = callRepository.getAgoraToken(callId)
        val credentials = credentialsResult.getOrElse { return Result.failure(it) }

        return Result.success(CallInitResult(callId, credentials))
    }
}
