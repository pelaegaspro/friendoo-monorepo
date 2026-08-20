package com.friendoo.app.presentation.host

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.friendoo.app.core.model.CallType
import com.friendoo.app.data.repository.AuthRepository
import com.friendoo.app.data.repository.CallRepository
import com.friendoo.app.domain.usecase.CallInitResult
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class IncomingCallOffer(
    val callId: String,
    val callerAlias: String,
    val ratePerMinute: Int,
    val callType: CallType,
    val secondsLeft: Int = 45
)

sealed class IncomingCallAction {
    data class Join(val result: CallInitResult, val callerAlias: String, val callType: CallType, val ratePerMinute: Int) :
        IncomingCallAction()
    object Dismissed : IncomingCallAction()
}

@HiltViewModel
class IncomingCallViewModel @Inject constructor(
    private val firestore: FirebaseFirestore,
    private val authRepository: AuthRepository,
    private val callRepository: CallRepository
) : ViewModel() {

    private val _incoming = MutableStateFlow<IncomingCallOffer?>(null)
    val incoming: StateFlow<IncomingCallOffer?> = _incoming

    private val _action = MutableStateFlow<IncomingCallAction?>(null)
    val action: StateFlow<IncomingCallAction?> = _action

    private val _isAccepting = MutableStateFlow(false)
    val isAccepting: StateFlow<Boolean> = _isAccepting

    private var listener: ListenerRegistration? = null
    private var countdownJob: Job? = null
    private var listening = false

    fun startListening() {
        if (listening) return
        val hostId = authRepository.getCurrentUserId()
        if (hostId.isNullOrBlank()) return
        listening = true

        listener = firestore.collection("calls")
            .whereEqualTo("hostId", hostId)
            .whereEqualTo("state", "ringing")
            .limit(1)
            .addSnapshotListener { snapshot, error ->
                if (error != null) return@addSnapshotListener
                val doc = snapshot?.documents?.firstOrNull()
                if (doc == null) {
                    if (_incoming.value != null && !_isAccepting.value) {
                        _incoming.value = null
                    }
                    return@addSnapshotListener
                }
                val data = doc.data ?: return@addSnapshotListener
                val callId = doc.id
                if (_incoming.value?.callId == callId) return@addSnapshotListener

                val alias = data["fromDisplayName"] as? String ?: "Anonymous"
                val rate = (data["ratePerMinute"] as? Number)?.toInt() ?: 5
                val type = CallType.fromString(data["callType"] as? String ?: "audio")
                _incoming.value = IncomingCallOffer(callId, alias, rate, type)
                startCountdown(callId)
            }
    }

    fun stopListening() {
        listener?.remove()
        listener = null
        countdownJob?.cancel()
        listening = false
        _incoming.value = null
    }

    fun acceptIncoming() {
        val offer = _incoming.value ?: return
        if (_isAccepting.value) return
        _isAccepting.value = true
        countdownJob?.cancel()
        viewModelScope.launch {
            val result = callRepository.acceptIncomingCall(offer.callId)
            result.fold(
                onSuccess = { init ->
                    _action.value = IncomingCallAction.Join(
                        init,
                        offer.callerAlias,
                        offer.callType,
                        offer.ratePerMinute
                    )
                    _incoming.value = null
                },
                onFailure = {
                    _isAccepting.value = false
                    declineIncoming()
                }
            )
        }
    }

    fun declineIncoming() {
        val offer = _incoming.value ?: return
        countdownJob?.cancel()
        viewModelScope.launch {
            callRepository.rejectCall(offer.callId, "host_declined")
            _incoming.value = null
            _action.value = IncomingCallAction.Dismissed
        }
    }

    fun clearAction() {
        _action.value = null
        _isAccepting.value = false
    }

    private fun startCountdown(callId: String) {
        countdownJob?.cancel()
        countdownJob = viewModelScope.launch {
            var left = 45
            while (left > 0) {
                val current = _incoming.value
                if (current == null || current.callId != callId) return@launch
                _incoming.value = current.copy(secondsLeft = left)
                delay(1000)
                left--
            }
            if (_incoming.value?.callId == callId && !_isAccepting.value) {
                callRepository.rejectCall(callId, "ring_timeout")
                _incoming.value = null
                _action.value = IncomingCallAction.Dismissed
            }
        }
    }

    override fun onCleared() {
        stopListening()
        super.onCleared()
    }
}
