package com.friendoo.app.data.repository

import com.friendoo.app.data.remote.api.InsForgeApiService
import com.friendoo.app.data.remote.api.dto.*
import javax.inject.Inject
import javax.inject.Singleton

/**
 * InsForge Repository for handling all backend operations
 * Replaces Firebase repositories with InsForge API calls
 */
@Singleton
class InsForgeRepository @Inject constructor(
    private val apiService: InsForgeApiService
) {

    // Authentication operations
    suspend fun register(email: String, name: String, phone: String? = null, role: String = "user"): Result<AuthResponse> {
        return try {
            val request = RegisterRequest(email, name, phone, role)
            val response = apiService.register(request)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Registration failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun login(email: String): Result<AuthResponse> {
        return try {
            val request = LoginRequest(email)
            val response = apiService.login(request)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Login failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateProfile(
        userId: String,
        name: String? = null,
        avatar: String? = null,
        phone: String? = null,
        gender: String? = null,
        location: String? = null,
        bio: String? = null,
        tags: List<String>? = null,
        languages: List<String>? = null
    ): Result<ApiResponse> {
        return try {
            val request = UpdateProfileRequest(userId, name, avatar, phone, gender, location, bio, tags, languages)
            val response = apiService.updateProfile(request)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Profile update failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getProfile(userId: String): Result<ProfileResponse> {
        return try {
            val url = "auth?action=profile&userId=$userId"
            val response = apiService.getProfile(url)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Get profile failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getHosts(
        tier: String? = null,
        search: String? = null,
        limit: Int = 20,
        offset: Int = 0
    ): Result<HostsResponse> {
        return try {
            val params = mutableListOf<String>()
            tier?.let { params.add("tier=$it") }
            search?.let { params.add("search=$it") }
            params.add("limit=$limit")
            params.add("offset=$offset")
            
            val url = "auth?action=hosts&${params.joinToString("&")}"
            val response = apiService.getHosts(url)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Get hosts failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Payment operations
    suspend fun getCoinPacks(): Result<CoinPacksResponse> {
        return try {
            val response = apiService.getCoinPacks()
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Get coin packs failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getUserBalance(userId: String): Result<BalanceResponse> {
        return try {
            val url = "payments?action=user-balance&userId=$userId"
            val response = apiService.getUserBalance(url)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Get balance failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createPaymentOrder(
        userId: String,
        coinPackId: String,
        paymentProvider: String = "cashfree"
    ): Result<PaymentOrderResponse> {
        return try {
            val request = CreateOrderRequest(userId, coinPackId, paymentProvider)
            val response = apiService.createPaymentOrder(request)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Create payment order failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun verifyPayment(
        orderId: String,
        providerOrderId: String,
        status: String
    ): Result<PaymentVerificationResponse> {
        return try {
            val request = VerifyPaymentRequest(orderId, providerOrderId, status)
            val response = apiService.verifyPayment(request)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Verify payment failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun spendCoins(
        userId: String,
        amount: Int,
        referenceType: String,
        referenceId: String,
        description: String
    ): Result<BalanceResponse> {
        return try {
            val request = SpendCoinsRequest(userId, amount, referenceType, referenceId, description)
            val response = apiService.spendCoins(request)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Spend coins failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getTransactionHistory(
        userId: String,
        type: String? = null,
        limit: Int = 20,
        offset: Int = 0
    ): Result<TransactionsResponse> {
        return try {
            val params = "userId=$userId&limit=$limit&offset=$offset" + 
                    (type?.let { "&type=$it" } ?: "")
            val url = "payments?action=transaction-history&$params"
            val response = apiService.getTransactionHistory(url)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Get transaction history failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Realtime operations
    suspend fun getRealtimeToken(userId: String, role: String): Result<RealtimeTokenResponse> {
        return try {
            val url = "realtime?action=token&userId=$userId&role=$role"
            val response = apiService.getRealtimeToken(url)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Get realtime token failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun sendTypingIndicator(
        conversationId: String? = null,
        ticketId: String? = null,
        userId: String,
        isTyping: Boolean
    ): Result<ApiResponse> {
        return try {
            val request = TypingIndicatorRequest(conversationId, ticketId, userId, isTyping)
            val response = apiService.sendTypingIndicator(request)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Send typing indicator failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Support operations
    suspend fun createSupportTicket(
        userId: String,
        subject: String,
        category: String = "general",
        priority: String = "medium",
        description: String
    ): Result<SupportTicketResponse> {
        return try {
            val request = CreateTicketRequest(userId, subject, category, priority, description)
            val response = apiService.createSupportTicket(request)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Create support ticket failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun sendSupportMessage(
        ticketId: String,
        senderId: String,
        content: String,
        type: String = "text",
        isInternal: Boolean = false
    ): Result<MessageResponse> {
        return try {
            val request = SendSupportMessageRequest(ticketId, senderId, content, type, isInternal)
            val response = apiService.sendSupportMessage(request)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Send support message failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getSupportTickets(
        userId: String,
        role: String,
        status: String? = null,
        limit: Int = 20,
        offset: Int = 0
    ): Result<SupportTicketsResponse> {
        return try {
            val params = "userId=$userId&role=$role&limit=$limit&offset=$offset" + 
                    (status?.let { "&status=$it" } ?: "")
            val url = "support?action=tickets&$params"
            val response = apiService.getSupportTickets(url)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Get support tickets failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getSupportTicket(ticketId: String): Result<SupportTicketResponse> {
        return try {
            val url = "support?action=ticket&ticketId=$ticketId"
            val response = apiService.getSupportTicket(url)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Get support ticket failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getSupportMessages(ticketId: String): Result<MessagesResponse> {
        return try {
            val url = "support?action=messages&ticketId=$ticketId"
            val response = apiService.getSupportMessages(url)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Get support messages failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Host wallet operations (stub implementations)
    suspend fun getHostProfile(userId: String): Result<HostDto> {
        return try {
            val url = "auth?action=host-profile&userId=$userId"
            val response = apiService.getHosts(url)
            if (response.isSuccessful) {
                val hosts = response.body()?.hosts
                val host = hosts?.firstOrNull { it.userId == userId }
                if (host != null) {
                    Result.success(HostDto(
                        id = host.id,
                        userId = host.userId,
                        tier = "normal",
                        rating = 0.0,
                        totalEarnings = 0.0,
                        monthlyEarnings = 0.0,
                        totalMinutes = 0,
                        verificationStatus = "verified",
                        createdAt = "",
                        updatedAt = ""
                    ))
                } else {
                    Result.failure(Exception("Host not found"))
                }
            } else {
                Result.failure(Exception("Get host profile failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getHostTransactions(userId: String): Result<List<com.friendoo.app.data.remote.api.dto.TransactionDto>> {
        return try {
            val url = "payments?action=host-transactions&userId=$userId"
            val response = apiService.getTransactionHistory(url)
            if (response.isSuccessful) {
                Result.success(response.body()?.transactions ?: emptyList())
            } else {
                Result.failure(Exception("Get host transactions failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun requestWithdrawal(userId: String, amount: Double, upiId: String?): Result<ApiResponse> {
        return try {
            // This is a stub - actual implementation would call the API
            Result.success(ApiResponse(message = "Withdrawal request submitted"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

