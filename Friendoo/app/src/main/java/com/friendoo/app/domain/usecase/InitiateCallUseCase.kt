package com.friendoo.app.domain.usecase

import com.friendoo.app.data.repository.CallRepository
import javax.inject.Inject

class InitiateCallUseCase @Inject constructor(
    private val callRepository: CallRepository
) {
    suspend operator fun invoke(channelName: String, uid: Int): Result<String> {
        return callRepository.getAgoraToken(channelName, uid)
    }
}
