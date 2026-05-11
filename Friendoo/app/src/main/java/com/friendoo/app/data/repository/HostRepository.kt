package com.friendoo.app.data.repository

import com.friendoo.app.data.model.Host
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Stub Host Repository - returns mock data
 */
@Singleton
class HostRepository @Inject constructor(
    private val insForgeRepository: InsForgeRepository
) {
    suspend fun getHosts(): Result<List<Host>> {
        return try {
            // Stub - return mock hosts
            Result.success(
                listOf(
                    Host(
                        uid = "host1",
                        alias = "Priya",
                        bio = "Love to chat about movies and life",
                        isStarHost = true,
                        languages = listOf("Hindi", "English")
                    ),
                    Host(
                        uid = "host2",
                        alias = "Anjali",
                        bio = "Friendly conversations await",
                        isOnline = true,
                        languages = listOf("Tamil", "English")
                    )
                )
            )
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
