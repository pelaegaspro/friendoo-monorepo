package com.friendoo.app.presentation.host

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.friendoo.app.core.presence.PresenceManager
import com.friendoo.app.data.repository.AuthRepository
import com.google.firebase.firestore.FirebaseFirestore
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

@HiltViewModel
class HostDashboardViewModel @Inject constructor(
    private val firestore: FirebaseFirestore,
    private val authRepository: AuthRepository,
    private val presenceManager: PresenceManager
) : ViewModel() {

    private val _isOnline = MutableStateFlow(false)
    val isOnline: StateFlow<Boolean> = _isOnline

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    private val uid: String
        get() = authRepository.getCurrentUserId().orEmpty()

    private var heartbeatJob: Job? = null

    init {
        loadPresenceStatus()
    }

    private fun startHeartbeatLoop() {
        heartbeatJob?.cancel()
        heartbeatJob = viewModelScope.launch {
            while (isActive && _isOnline.value) {
                presenceManager.setHostWantsOnline(true)
                delay(30_000)
            }
        }
    }

    private fun stopHeartbeatLoop() {
        heartbeatJob?.cancel()
        heartbeatJob = null
    }

    fun loadPresenceStatus() {
        val hostId = uid
        if (hostId.isBlank()) return

        _isLoading.value = true
        viewModelScope.launch {
            try {
                val snap = firestore.collection("hosts").document(hostId).get().await()
                if (snap.exists()) {
                    val online = snap.getBoolean("isOnline") == true
                    _isOnline.value = online
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to load presence status"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun toggleWorkMode(online: Boolean) {
        if (uid.isBlank()) return
        _isOnline.value = online
        _isLoading.value = true
        viewModelScope.launch {
            try {
                presenceManager.setHostWantsOnline(online)
                if (online) startHeartbeatLoop() else stopHeartbeatLoop()
                _error.value = null
            } catch (e: Exception) {
                _isOnline.value = !online
                _error.value = e.message ?: "Failed to update presence status"
            } finally {
                _isLoading.value = false
            }
        }
    }

    override fun onCleared() {
        stopHeartbeatLoop()
        super.onCleared()
    }
}
