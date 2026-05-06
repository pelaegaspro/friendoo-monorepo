package com.friendoo.app.domain.usecase

import com.friendoo.app.data.model.ChatMessage
import com.friendoo.app.data.repository.ChatRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetChatMessagesUseCase @Inject constructor(
    private val chatRepository: ChatRepository
) {
    operator fun invoke(userId: String, otherUserId: String): Flow<List<ChatMessage>> {
        return chatRepository.getChatMessages(userId, otherUserId)
    }
}
