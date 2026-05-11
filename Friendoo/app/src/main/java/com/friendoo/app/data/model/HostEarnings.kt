package com.friendoo.app.data.model

import java.util.Date

data class HostEarnings(
    val id: String = "",
    val hostId: String = "",
    val totalEarningsInr: Double = 0.0,
    val totalCallMinutes: Int = 0,
    val totalCalls: Int = 0,
    val availableForWithdrawal: Double = 0.0,
    val pendingWithdrawal: Double = 0.0,
    val lifetimeEarnings: Double = 0.0,
    val weeklyCallMinutes: Int = 0,
    val updatedAt: Date? = null
) {
    companion object {
        fun fromMap(map: Map<String, Any?>): HostEarnings = HostEarnings(
            hostId = map["hostId"] as? String ?: "",
            totalEarningsInr = (map["totalEarningsInr"] as? Number)?.toDouble() ?: 0.0,
            totalCallMinutes = (map["totalCallMinutes"] as? Number)?.toInt() ?: 0,
            totalCalls = (map["totalCalls"] as? Number)?.toInt() ?: 0,
            availableForWithdrawal = (map["availableForWithdrawal"] as? Number)?.toDouble() ?: 0.0,
            pendingWithdrawal = (map["pendingWithdrawal"] as? Number)?.toDouble() ?: 0.0,
            lifetimeEarnings = (map["lifetimeEarnings"] as? Number)?.toDouble() ?: 0.0,
            weeklyCallMinutes = (map["weeklyCallMinutes"] as? Number)?.toInt() ?: 0,
            updatedAt = map["updatedAt"] as? Date
        )
    }

    fun toMap(): Map<String, Any?> = mapOf(
        "hostId" to hostId,
        "totalEarningsInr" to totalEarningsInr,
        "totalCallMinutes" to totalCallMinutes,
        "totalCalls" to totalCalls,
        "availableForWithdrawal" to availableForWithdrawal,
        "pendingWithdrawal" to pendingWithdrawal,
        "lifetimeEarnings" to lifetimeEarnings,
        "weeklyCallMinutes" to weeklyCallMinutes,
        "updatedAt" to updatedAt
    )
}
