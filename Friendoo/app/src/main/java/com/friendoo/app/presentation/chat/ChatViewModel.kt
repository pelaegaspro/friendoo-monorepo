package com.friendoo.app.presentation.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.friendoo.app.data.local.UserPreferences
import com.friendoo.app.data.model.ChatMessage
import com.friendoo.app.domain.usecase.GetChatMessagesUseCase
import com.friendoo.app.data.repository.ChatRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val getChatMessagesUseCase: GetChatMessagesUseCase,
    private val chatRepository: ChatRepository,
    private val userPreferences: UserPreferences
) : ViewModel() {

    private val _messages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val messages: StateFlow<List<ChatMessage>> = _messages
    
    private val _currentUserId = MutableStateFlow<String>("")
    val currentUserId: StateFlow<String> = _currentUserId

    init {
        viewModelScope.launch {
            _currentUserId.value = userPreferences.userIdFlow.firstOrNull() ?: ""
        }
    }

    fun loadMessages(otherUserId: String) {
        viewModelScope.launch {
            val myId = _currentUserId.value
            if (myId.isNotEmpty()) {
                getChatMessagesUseCase(myId, otherUserId).collect { msgs ->
                    _messages.value = msgs
                }
            }
        }
    }

    fun sendMessage(otherUserId: String, text: String) {
        viewModelScope.launch {
            val myId = _currentUserId.value
            if (myId.isNotEmpty() && text.isNotBlank()) {
                chatRepository.sendMessage(myId, otherUserId, text)
            }
        }
    }
}
