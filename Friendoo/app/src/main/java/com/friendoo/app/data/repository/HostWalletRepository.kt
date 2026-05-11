package com.friendoo.app.data.repository

import com.friendoo.app.data.model.HostEarnings
import com.friendoo.app.data.model.WithdrawalRequest
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import java.util.Date
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class HostWalletRepository @Inject constructor(
    private val insForgeRepository: InsForgeRepository
) {
    fun getHostEarnings(hostId: String): Flow<Result<HostEarnings>> = flow {
        // Stub implementation - returns mock data
        val mockEarnings = HostEarnings(
            id = hostId,
            hostId = hostId,
            totalEarningsInr = 5000.0,
            availableForWithdrawal = 3000.0,
            pendingWithdrawal = 0.0,
            totalCallMinutes = 120,
            weeklyCallMinutes = 30,
            updatedAt = Date()
        )
        emit(Result.success(mockEarnings))
    }

    suspend fun requestWithdrawal(hostId: String, amount: Double, upiId: String): Result<Unit> {
        // Use InsForge repository for withdrawal
        return insForgeRepository.requestWithdrawal(hostId, amount, upiId).map { }
    }

    fun getWithdrawalHistory(hostId: String): Flow<Result<List<WithdrawalRequest>>> = flow {
        // Stub implementation - returns empty list
        emit(Result.success(emptyList()))
    }
}
