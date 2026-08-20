package com.friendoo.app.core.presence

import android.util.Log
import com.friendoo.app.data.local.UserPreferences
import com.friendoo.app.data.remote.firebase.FirebaseFunctionsSource
import com.friendoo.app.data.repository.AuthRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Presence is server-authoritative via presenceHeartbeat callable.
 */
@Singleton
class PresenceManager @Inject constructor(
    private val functionsSource: FirebaseFunctionsSource,
    private val authRepository: AuthRepository,
    private val userPreferences: UserPreferences
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var heartbeatJob: Job? = null
    private var hostWantsOnline = false
    private val deviceId: String = UUID.randomUUID().toString()

    suspend fun setHostWantsOnline(online: Boolean) {
        hostWantsOnline = online
        if (online) {
            startHeartbeatLoop()
        } else {
            stopHeartbeatLoop()
            sendHeartbeat()
        }
    }

    fun onAppForeground() {
        if (hostWantsOnline) {
            startHeartbeatLoop()
        }
    }

    fun onAppBackground() {
        stopHeartbeatLoop()
        scope.launch {
            if (authRepository.getCurrentUserId() == null) return@launch
            val isHost = userPreferences.isHostFlow.first()
            if (!isHost) return@launch
            functionsSource.callPresenceHeartbeat(deviceId, false)
        }
    }

    private fun startHeartbeatLoop() {
        heartbeatJob?.cancel()
        heartbeatJob = scope.launch {
            while (true) {
                sendHeartbeat()
                delay(30_000)
            }
        }
    }

    private fun stopHeartbeatLoop() {
        heartbeatJob?.cancel()
        heartbeatJob = null
    }

    private suspend fun sendHeartbeat() {
        if (authRepository.getCurrentUserId() == null) return
        val isHost = userPreferences.isHostFlow.first()
        if (!isHost) return

        val result = functionsSource.callPresenceHeartbeat(deviceId, hostWantsOnline)
        result.onFailure { e ->
            Log.w("PresenceManager", "heartbeat failed: ${e.message}")
        }
    }
}
