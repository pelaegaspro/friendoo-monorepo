package com.friendoo.app.data.remote.api.dto

import com.google.gson.annotations.SerializedName

// Base response
data class ApiResponse(
    @SerializedName("message") val message: String
)

data class ErrorResponse(
    @SerializedName("error") val error: String
)

// Authentication DTOs
data class RegisterRequest(
    @SerializedName("email") val email: String,
    @SerializedName("name") val name: String,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("role") val role: String = "user",
    @SerializedName("gender") val gender: String? = null,
    @SerializedName("location") val location: String? = null
)

data class LoginRequest(
    @SerializedName("email") val email: String
)

data class UpdateProfileRequest(
    @SerializedName("userId") val userId: String,
    @SerializedName("name") val name: String? = null,
    @SerializedName("avatar") val avatar: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("gender") val gender: String? = null,
    @SerializedName("location") val location: String? = null,
    @SerializedName("bio") val bio: String? = null,
    @SerializedName("tags") val tags: List<String>? = null,
    @SerializedName("languages") val languages: List<String>? = null
)

data class AuthResponse(
    @SerializedName("message") val message: String,
    @SerializedName("user") val user: UserDto
)

data class ProfileResponse(
    @SerializedName("user") val user: UserDto,
    @SerializedName("host") val host: HostDto? = null
)

data class UserDto(
    @SerializedName("id") val id: String,
    @SerializedName("email") val email: String,
    @SerializedName("name") val name: String,
    @SerializedName("role") val role: String,
    @SerializedName("status") val status: String,
    @SerializedName("avatar") val avatar: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("gender") val gender: String? = null,
    @SerializedName("location") val location: String? = null,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("updated_at") val updatedAt: String
)

data class HostDto(
    @SerializedName("id") val id: String,
    @SerializedName("user_id") val userId: String,
    @SerializedName("tier") val tier: String,
    @SerializedName("rating") val rating: Double,
    @SerializedName("total_earnings") val totalEarnings: Double,
    @SerializedName("monthly_earnings") val monthlyEarnings: Double,
    @SerializedName("total_minutes") val totalMinutes: Int,
    @SerializedName("verification_status") val verificationStatus: String,
    @SerializedName("bio") val bio: String? = null,
    @SerializedName("tags") val tags: List<String> = emptyList(),
    @SerializedName("languages") val languages: List<String> = emptyList(),
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("updated_at") val updatedAt: String,
    @SerializedName("earnings_inr") val earningsInr: String? = null,
    @SerializedName("upi_id") val upiId: String? = null
)

data class HostsResponse(
    @SerializedName("hosts") val hosts: List<HostWithUserDto>
)

data class HostWithUserDto(
    @SerializedName("id") val id: String,
    @SerializedName("user_id") val userId: String,
    @SerializedName("tier") val tier: String,
    @SerializedName("rating") val rating: Double,
    @SerializedName("total_earnings") val totalEarnings: Double,
    @SerializedName("monthly_earnings") val monthlyEarnings: Double,
    @SerializedName("total_minutes") val totalMinutes: Int,
    @SerializedName("verification_status") val verificationStatus: String,
    @SerializedName("bio") val bio: String? = null,
    @SerializedName("tags") val tags: List<String>,
    @SerializedName("languages") val languages: List<String>,
    @SerializedName("user_id") val hostUserId: String,
    @SerializedName("name") val name: String,
    @SerializedName("avatar") val avatar: String? = null,
    @SerializedName("location") val location: String? = null
)

// Chat DTOs
data class StartConversationRequest(
    @SerializedName("userId") val userId: String,
    @SerializedName("hostId") val hostId: String
)

data class ConversationResponse(
    @SerializedName("message") val message: String,
    @SerializedName("conversationId") val conversationId: String,
    @SerializedName("createdAt") val createdAt: String? = null
)

data class SendMessageRequest(
    @SerializedName("conversationId") val conversationId: String,
    @SerializedName("senderId") val senderId: String,
    @SerializedName("receiverId") val receiverId: String,
    @SerializedName("type") val type: String = "text",
    @SerializedName("content") val content: String,
    @SerializedName("metadata") val metadata: Map<String, Any>? = null
)

data class MessageResponse(
    @SerializedName("message") val message: String,
    @SerializedName("messageId") val messageId: String,
    @SerializedName("createdAt") val createdAt: String
)

data class ConversationsResponse(
    @SerializedName("conversations") val conversations: List<ConversationDto>
)

data class ConversationDto(
    @SerializedName("id") val id: String,
    @SerializedName("user_id") val userId: String,
    @SerializedName("host_id") val hostId: String,
    @SerializedName("status") val status: String,
    @SerializedName("last_message_at") val lastMessageAt: String? = null,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("updated_at") val updatedAt: String,
    @SerializedName("other_user_id") val otherUserId: String,
    @SerializedName("other_user_name") val otherUserName: String,
    @SerializedName("other_user_avatar") val otherUserAvatar: String? = null,
    @SerializedName("other_user_location") val otherUserLocation: String? = null,
    @SerializedName("host_tier") val hostTier: String? = null,
    @SerializedName("host_rating") val hostRating: Double? = null
)

data class MessagesResponse(
    @SerializedName("messages") val messages: List<MessageDto>
)

data class MessageDto(
    @SerializedName("id") val id: String,
    @SerializedName("type") val type: String,
    @SerializedName("content") val content: String,
    @SerializedName("metadata") val metadata: Map<String, Any>? = null,
    @SerializedName("read_at") val readAt: String? = null,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("sender_name") val senderName: String,
    @SerializedName("sender_avatar") val senderAvatar: String? = null
)

data class EndConversationRequest(
    @SerializedName("conversationId") val conversationId: String,
    @SerializedName("userId") val userId: String
)

// Payment DTOs
data class CoinPacksResponse(
    @SerializedName("coinPacks") val coinPacks: List<CoinPackDto>
)

data class CoinPackDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("price_inr") val priceInr: Double,
    @SerializedName("coins") val coins: Int,
    @SerializedName("bonus_coins") val bonusCoins: Int,
    @SerializedName("active") val active: Boolean
)

data class BalanceResponse(
    @SerializedName("balance") val balance: BalanceDto
)

data class BalanceDto(
    @SerializedName("balance") val balance: Int,
    @SerializedName("total_purchased") val totalPurchased: Int,
    @SerializedName("total_spent") val totalSpent: Int
)

data class CreateOrderRequest(
    @SerializedName("userId") val userId: String,
    @SerializedName("coinPackId") val coinPackId: String,
    @SerializedName("paymentProvider") val paymentProvider: String = "razorpay"
)

data class PaymentOrderResponse(
    @SerializedName("message") val message: String,
    @SerializedName("order") val order: PaymentOrderDto
)

data class PaymentOrderDto(
    @SerializedName("id") val id: String,
    @SerializedName("amount") val amount: Double,
    @SerializedName("coins") val coins: Int,
    @SerializedName("providerOrder") val providerOrder: ProviderOrderDto
)

data class ProviderOrderDto(
    @SerializedName("orderId") val orderId: String,
    @SerializedName("amount") val amount: Int,
    @SerializedName("currency") val currency: String,
    @SerializedName("receipt") val receipt: String
)

data class VerifyPaymentRequest(
    @SerializedName("orderId") val orderId: String,
    @SerializedName("providerOrderId") val providerOrderId: String,
    @SerializedName("status") val status: String
)

data class PaymentVerificationResponse(
    @SerializedName("message") val message: String,
    @SerializedName("newBalance") val newBalance: Int? = null
)

data class SpendCoinsRequest(
    @SerializedName("userId") val userId: String,
    @SerializedName("amount") val amount: Int,
    @SerializedName("referenceType") val referenceType: String,
    @SerializedName("referenceId") val referenceId: String,
    @SerializedName("description") val description: String
)

data class TransactionsResponse(
    @SerializedName("transactions") val transactions: List<TransactionDto>
)

data class TransactionDto(
    @SerializedName("type") val type: String,
    @SerializedName("amount") val amount: Int,
    @SerializedName("balance_after") val balanceAfter: Int,
    @SerializedName("reference_type") val referenceType: String,
    @SerializedName("reference_id") val referenceId: String,
    @SerializedName("description") val description: String,
    @SerializedName("created_at") val createdAt: String
)

// Realtime DTOs
data class RealtimeTokenResponse(
    @SerializedName("token") val token: String,
    @SerializedName("wsUrl") val wsUrl: String,
    @SerializedName("user") val user: UserDto
)

data class TypingIndicatorRequest(
    @SerializedName("conversationId") val conversationId: String? = null,
    @SerializedName("ticketId") val ticketId: String? = null,
    @SerializedName("userId") val userId: String,
    @SerializedName("isTyping") val isTyping: Boolean
)

// AI DTOs
data class SuggestReplyRequest(
    @SerializedName("message") val message: String,
    @SerializedName("conversationContext") val conversationContext: String? = null,
    @SerializedName("userLanguage") val userLanguage: String = "en"
)

data class SuggestReplyResponse(
    @SerializedName("suggestions") val suggestions: List<String>
)

data class ModerateContentRequest(
    @SerializedName("content") val content: String,
    @SerializedName("contentType") val contentType: String = "text"
)

data class ModerationResponse(
    @SerializedName("isSafe") val isSafe: Boolean,
    @SerializedName("riskLevel") val riskLevel: String,
    @SerializedName("reason") val reason: String,
    @SerializedName("filteredContent") val filteredContent: String? = null
)

data class TranslateMessageRequest(
    @SerializedName("message") val message: String,
    @SerializedName("fromLanguage") val fromLanguage: String,
    @SerializedName("toLanguage") val toLanguage: String
)

data class TranslationResponse(
    @SerializedName("originalMessage") val originalMessage: String,
    @SerializedName("translatedMessage") val translatedMessage: String,
    @SerializedName("fromLanguage") val fromLanguage: String,
    @SerializedName("toLanguage") val toLanguage: String
)

// Support DTOs
data class CreateTicketRequest(
    @SerializedName("userId") val userId: String,
    @SerializedName("subject") val subject: String,
    @SerializedName("category") val category: String = "general",
    @SerializedName("priority") val priority: String = "medium",
    @SerializedName("description") val description: String
)

data class SupportTicketResponse(
    @SerializedName("message") val message: String,
    @SerializedName("ticket") val ticket: SupportTicketDto
)

data class SupportTicketDto(
    @SerializedName("id") val id: String,
    @SerializedName("user_id") val userId: String,
    @SerializedName("subject") val subject: String,
    @SerializedName("category") val category: String,
    @SerializedName("priority") val priority: String,
    @SerializedName("status") val status: String,
    @SerializedName("assigned_to") val assignedTo: String? = null,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("updated_at") val updatedAt: String,
    @SerializedName("user_name") val userName: String,
    @SerializedName("assigned_agent_name") val assignedAgentName: String? = null,
    @SerializedName("message_count") val messageCount: Int? = null
)

data class SendSupportMessageRequest(
    @SerializedName("ticketId") val ticketId: String,
    @SerializedName("senderId") val senderId: String,
    @SerializedName("content") val content: String,
    @SerializedName("type") val type: String = "text",
    @SerializedName("isInternal") val isInternal: Boolean = false
)

data class SupportTicketsResponse(
    @SerializedName("tickets") val tickets: List<SupportTicketDto>
)
