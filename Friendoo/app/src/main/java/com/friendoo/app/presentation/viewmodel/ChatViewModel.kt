package com.friendoo.app.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.friendoo.app.data.remote.websocket.InsForgeWebSocketManager
import com.friendoo.app.data.remote.websocket.WebSocketMessage
import com.friendoo.app.data.remote.websocket.NewMessageMessage
import com.friendoo.app.data.remote.websocket.PresenceMessage
import com.friendoo.app.data.remote.websocket.TypingMessage
import com.friendoo.app.data.repository.InsForgeRepository
import com.friendoo.app.data.remote.api.dto.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Chat ViewModel using InsForge backend
 * Handles real-time messaging, presence, and typing indicators
 */
@HiltViewModel
class ChatViewModel @Inject constructor(
    private val repository: InsForgeRepository,
    private val webSocketManager: InsForgeWebSocketManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()

    private val _currentConversation = MutableStateFlow<ConversationDto?>(null)
    val currentConversation: StateFlow<ConversationDto?> = _currentConversation.asStateFlow()

    init {
        // Listen to WebSocket messages
        viewModelScope.launch {
            combine(
                webSocketManager.messageFlow,
                webSocketManager.connectionStateFlow
            ) { message, isConnected ->
                handleWebSocketMessage(message)
                _uiState.value = _uiState.value.copy(isConnected = isConnected)
            }
        }
    }

    fun connectRealtime(userId: String, role: String) {
        viewModelScope.launch {
            repository.getRealtimeToken(userId, role)
                .onSuccess { tokenResponse ->
                    webSocketManager.connect(tokenResponse.wsUrl)
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        error = "Failed to connect: ${error.message}"
                    )
                }
        }
    }

    fun disconnectRealtime() {
        webSocketManager.disconnect()
    }

    fun loadConversations(userId: String, role: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            repository.getConversations(userId, role)
                .onSuccess { response ->
                    _uiState.value = _uiState.value.copy(
                        conversations = response.conversations,
                        isLoading = false
                    )
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = "Failed to load conversations: ${error.message}"
                    )
                }
        }
    }

    fun loadMessages(conversationId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            repository.getMessages(conversationId)
                .onSuccess { response ->
                    _uiState.value = _uiState.value.copy(
                        messages = response.messages,
                        isLoading = false
                    )
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = "Failed to load messages: ${error.message}"
                    )
                }
        }
    }

    fun sendMessage(
        conversationId: String,
        senderId: String,
        receiverId: String,
        content: String
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSending = true)
            
            repository.sendMessage(conversationId, senderId, receiverId, content)
                .onSuccess { response ->
                    _uiState.value = _uiState.value.copy(isSending = false)
                    // Messages will be updated via WebSocket
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        isSending = false,
                        error = "Failed to send message: ${error.message}"
                    )
                }
        }
    }

    fun startConversation(userId: String, hostId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            repository.startConversation(userId, hostId)
                .onSuccess { response ->
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    loadConversations(userId, "user")
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = "Failed to start conversation: ${error.message}"
                    )
                }
        }
    }

    fun sendTypingIndicator(conversationId: String, userId: String, isTyping: Boolean) {
        viewModelScope.launch {
            repository.sendTypingIndicator(
                conversationId = conversationId,
                userId = userId,
                isTyping = isTyping
            )
        }
    }

    fun suggestReply(message: String, context: String? = null) {
        viewModelScope.launch {
            repository.suggestReply(message, context)
                .onSuccess { response ->
                    _uiState.value = _uiState.value.copy(
                        suggestedReplies = response.suggestions
                    )
                }
                .onFailure { error ->
                    // Handle error silently or show to user
                }
        }
    }

    fun moderateContent(content: String) {
        viewModelScope.launch {
            repository.moderateContent(content)
                .onSuccess { response ->
                    if (!response.isSafe) {
                        _uiState.value = _uiState.value.copy(
                            contentWarning = response.reason
                        )
                    }
                }
                .onFailure { error ->
                    // Handle error silently
                }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    fun clearContentWarning() {
        _uiState.value = _uiState.value.copy(contentWarning = null)
    }

    private fun handleWebSocketMessage(message: WebSocketMessage) {
        when (message) {
            is NewMessageMessage -> {
                // Add new message to current conversation
                val currentMessages = _uiState.value.messages.toMutableList()
                val newMessage = MessageDto(
                    id = message.messageId,
                    type = "text",
                    content = message.content,
                    metadata = null,
                    readAt = null,
                    createdAt = message.timestamp,
                    senderName = "", // Will be populated from user data
                    senderAvatar = null
                )
                currentMessages.add(newMessage)
                _uiState.value = _uiState.value.copy(messages = currentMessages)
            }
            
            is PresenceMessage -> {
                // Update user presence
                val currentPresence = _uiState.value.userPresence.toMutableMap()
                currentPresence[message.userId] = message
                _uiState.value = _uiState.value.copy(userPresence = currentPresence)
            }
            
            is TypingMessage -> {
                // Update typing indicators
                val currentTyping = _uiState.value.typingIndicators.toMutableMap()
                val key = message.conversationId ?: message.ticketId ?: ""
                currentTyping[key] = message
                _uiState.value = _uiState.value.copy(typingIndicators = currentTyping)
            }
            
            else -> {
                // Handle unknown message types
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        disconnectRealtime()
    }
}

data class ChatUiState(
    val isLoading: Boolean = false,
    val isSending: Boolean = false,
    val isConnected: Boolean = false,
    val conversations: List<ConversationDto> = emptyList(),
    val messages: List<MessageDto> = emptyList(),
    val suggestedReplies: List<String> = emptyList(),
    val userPresence: Map<String, PresenceMessage> = emptyMap(),
    val typingIndicators: Map<String, TypingMessage> = emptyMap(),
    val error: String? = null,
    val contentWarning: String? = null
)
