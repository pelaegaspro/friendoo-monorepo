package com.friendoo.app.domain.usecase

import com.friendoo.app.data.model.FriendRequest
import com.friendoo.app.data.remote.firebase.FirestoreSource
import com.google.firebase.Timestamp
import java.util.UUID
import javax.inject.Inject

class SendFriendRequestUseCase @Inject constructor(
    private val firestoreSource: FirestoreSource
) {
    suspend operator fun invoke(fromId: String, toId: String): Result<Unit> {
        val reqId = UUID.randomUUID().toString()
        val req = FriendRequest(id = reqId, fromUserId = fromId, toUserId = toId, timestamp = Timestamp.now())
        return firestoreSource.setDocument("friend_requests", reqId, req.toMap())
    }
}
