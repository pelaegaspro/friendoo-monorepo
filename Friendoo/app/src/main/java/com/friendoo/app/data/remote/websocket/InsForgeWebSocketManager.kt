package com.friendoo.app.data.remote.websocket

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject

/**
 * WebSocket manager for InsForge real-time functionality
 * Handles live chat, presence, and typing indicators
 */
@Singleton
class InsForgeWebSocketManager @Inject constructor() {

    private var webSocket: WebSocket? = null
    private var isConnected = false

    private val _messageFlow = MutableSharedFlow<WebSocketMessage>()
    val messageFlow: Flow<WebSocketMessage> = _messageFlow.asSharedFlow()

    private val _connectionStateFlow = MutableSharedFlow<Boolean>()
    val connectionStateFlow: Flow<Boolean> = _connectionStateFlow.asSharedFlow()

    private val webSocketListener = object : WebSocketListener() {
        override fun onOpen(webSocket: WebSocket, response: Response) {
            isConnected = true
            _connectionStateFlow.tryEmit(true)
        }

        override fun onMessage(webSocket: WebSocket, text: String) {
            try {
                val jsonObject = JSONObject(text)
                val message = parseWebSocketMessage(jsonObject)
                _messageFlow.tryEmit(message)
            } catch (e: Exception) {
                // Handle parsing errors
            }
        }

        override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
            isConnected = false
            _connectionStateFlow.tryEmit(false)
        }

        override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
            isConnected = false
            _connectionStateFlow.tryEmit(false)
        }
    }

    fun connect(wsUrl: String) {
        if (isConnected) return

        val client = OkHttpClient()
        val request = Request.Builder().url(wsUrl).build()
        webSocket = client.newWebSocket(request, webSocketListener)
    }

    fun disconnect() {
        webSocket?.close(1000, "Disconnecting")
        webSocket = null
        isConnected = false
    }

    fun sendMessage(message: WebSocketMessage) {
        if (isConnected) {
            try {
                val json = message.toJson()
                webSocket?.send(json)
            } catch (e: Exception) {
                // Handle send errors
            }
        }
    }

    private fun parseWebSocketMessage(jsonObject: JSONObject): WebSocketMessage {
        val type = jsonObject.getString("type")
        return when (type) {
            "message" -> {
                val data = jsonObject.getJSONObject("data")
                NewMessageMessage(
                    type = type,
                    conversationId = jsonObject.optString("conversationId"),
                    ticketId = jsonObject.optString("ticketId"),
                    messageId = data.getString("id"),
                    content = data.getString("content"),
                    senderId = data.getString("senderId"),
                    timestamp = jsonObject.optString("timestamp")
                )
            }
            "presence" -> {
                PresenceMessage(
                    type = type,
                    userId = jsonObject.getString("userId"),
                    status = jsonObject.getString("status"),
                    lastSeen = jsonObject.optString("lastSeen")
                )
            }
            "typing" -> {
                TypingMessage(
                    type = type,
                    conversationId = jsonObject.optString("conversationId"),
                    ticketId = jsonObject.optString("ticketId"),
                    userId = jsonObject.getString("userId"),
                    isTyping = jsonObject.getBoolean("isTyping"),
                    timestamp = jsonObject.optString("timestamp")
                )
            }
            else -> UnknownMessage(type = type)
        }
    }

    fun isConnected(): Boolean = isConnected
}

// Base WebSocket message interface
sealed class WebSocketMessage {
    abstract val type: String
    abstract fun toJson(): String
}

// New message notification
data class NewMessageMessage(
    override val type: String,
    val conversationId: String?,
    val ticketId: String?,
    val messageId: String,
    val content: String,
    val senderId: String,
    val timestamp: String
) : WebSocketMessage() {
    override fun toJson(): String {
        return JSONObject().apply {
            put("type", type)
            conversationId?.let { put("conversationId", it) }
            ticketId?.let { put("ticketId", it) }
            put("data", JSONObject().apply {
                put("id", messageId)
                put("content", content)
                put("senderId", senderId)
            })
            put("timestamp", timestamp)
        }.toString()
    }
}

// User presence update
data class PresenceMessage(
    override val type: String,
    val userId: String,
    val status: String,
    val lastSeen: String?
) : WebSocketMessage() {
    override fun toJson(): String {
        return JSONObject().apply {
            put("type", type)
            put("userId", userId)
            put("status", status)
            lastSeen?.let { put("lastSeen", it) }
        }.toString()
    }
}

// Typing indicator
data class TypingMessage(
    override val type: String,
    val conversationId: String?,
    val ticketId: String?,
    val userId: String,
    val isTyping: Boolean,
    val timestamp: String
) : WebSocketMessage() {
    override fun toJson(): String {
        return JSONObject().apply {
            put("type", type)
            conversationId?.let { put("conversationId", it) }
            ticketId?.let { put("ticketId", it) }
            put("userId", userId)
            put("isTyping", isTyping)
            put("timestamp", timestamp)
        }.toString()
    }
}

// Unknown message type
data class UnknownMessage(
    override val type: String
) : WebSocketMessage() {
    override fun toJson(): String {
        return JSONObject().apply {
            put("type", type)
        }.toString()
    }
}
