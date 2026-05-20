package com.friendoo.app.data.remote.api

import com.friendoo.app.data.remote.api.dto.*
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.*

/**
 * InsForge API Service for Friendoo backend
 * Replaces Firebase Functions with InsForge Edge Functions
 */
interface InsForgeApiService {

    // Authentication endpoints
    @POST("auth?action=register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("auth?action=login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @POST("auth?action=update-profile")
    suspend fun updateProfile(@Body request: UpdateProfileRequest): Response<ApiResponse>

    @GET
    suspend fun getProfile(@Url url: String): Response<ProfileResponse>

    @GET
    suspend fun getHosts(@Url url: String): Response<HostsResponse>

    // Payment endpoints
    @GET("payments?action=coin-packs")
    suspend fun getCoinPacks(): Response<CoinPacksResponse>

    @GET
    suspend fun getUserBalance(@Url url: String): Response<BalanceResponse>

    @POST("payments?action=create-order")
    suspend fun createPaymentOrder(@Body request: CreateOrderRequest): Response<PaymentOrderResponse>

    @POST("payments?action=verify-payment")
    suspend fun verifyPayment(@Body request: VerifyPaymentRequest): Response<PaymentVerificationResponse>

    @POST("payments?action=spend-coins")
    suspend fun spendCoins(@Body request: SpendCoinsRequest): Response<BalanceResponse>

    @GET
    suspend fun getTransactionHistory(@Url url: String): Response<TransactionsResponse>

    // Realtime endpoints
    @GET
    suspend fun getRealtimeToken(@Url url: String): Response<RealtimeTokenResponse>

    @POST("realtime?action=typing")
    suspend fun sendTypingIndicator(@Body request: TypingIndicatorRequest): Response<ApiResponse>

    // Support endpoints
    @POST("support?action=create-ticket")
    suspend fun createSupportTicket(@Body request: CreateTicketRequest): Response<SupportTicketResponse>

    @POST("support?action=send-support-message")
    suspend fun sendSupportMessage(@Body request: SendSupportMessageRequest): Response<MessageResponse>

    @GET
    suspend fun getSupportTickets(@Url url: String): Response<SupportTicketsResponse>

    @GET
    suspend fun getSupportTicket(@Url url: String): Response<SupportTicketResponse>

    @GET
    suspend fun getSupportMessages(@Url url: String): Response<MessagesResponse>
}
