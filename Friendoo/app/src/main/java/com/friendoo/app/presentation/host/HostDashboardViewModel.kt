package com.friendoo.app.presentation.host

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.friendoo.app.data.remote.api.InsForgeAuthSource
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

@HiltViewModel
class HostDashboardViewModel @Inject constructor(
    private val firestore: FirebaseFirestore,
    private val authSource: InsForgeAuthSource
) : ViewModel() {

    private val _isOnline = MutableStateFlow(false)
    val isOnline: StateFlow<Boolean> = _isOnline

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    private val uid: String
        get() = authSource.getCurrentUser()?.uid.orEmpty()

    init {
        loadPresenceStatus()
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
        val hostId = uid
        if (hostId.isBlank()) return

        _isOnline.value = online
        _isLoading.value = true
        viewModelScope.launch {
            try {
                val presenceUpdates = mapOf(
                    "isOnline" to online,
                    "callStatus" to if (online) "available" else "offline",
                    "updatedAt" to FieldValue.serverTimestamp()
                )

                val hostUpdate = async {
                    firestore.collection("hosts")
                        .document(hostId)
                        .set(presenceUpdates, SetOptions.merge())
                        .await()
                }
                val userUpdate = async {
                    firestore.collection("users")
                        .document(hostId)
                        .set(presenceUpdates, SetOptions.merge())
                        .await()
                }
                hostUpdate.await()
                userUpdate.await()

                _error.value = null
            } catch (e: Exception) {
                // Rollback local state on error
                _isOnline.value = !online
                _error.value = e.message ?: "Failed to update presence status"
            } finally {
                _isLoading.value = false
            }
        }
    }
}
