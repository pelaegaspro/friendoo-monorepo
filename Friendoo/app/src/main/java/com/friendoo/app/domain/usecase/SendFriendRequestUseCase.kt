package com.friendoo.app.domain.usecase

import javax.inject.Inject

/**
 * Stub Send Friend Request Use Case - Firebase dependencies removed
 */
class SendFriendRequestUseCase @Inject constructor() {
    suspend operator fun invoke(fromId: String, toId: String): Result<Unit> {
        return Result.success(Unit)
    }
}
