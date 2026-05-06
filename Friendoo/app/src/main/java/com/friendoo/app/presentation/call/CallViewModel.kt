package com.friendoo.app.presentation.call

import android.content.Context
import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.friendoo.app.core.agora.AgoraManager
import com.friendoo.app.core.utils.Constants
import com.friendoo.app.data.repository.CallRepository
import com.friendoo.app.data.repository.HybridSafetyMonitor
import com.friendoo.app.data.repository.SafetyResult
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import dagger.hilt.android.lifecycle.HiltViewModel
import io.agora.rtc2.IRtcEngineEventHandler
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CallUiState(
    val isJoined: Boolean = false,
    val remoteUid: Int? = null,
    val durationSeconds: Long = 0,
    val coinsSpent: Int = 0,
    val isMuted: Boolean = false,
    val isVideoDisabled: Boolean = false,
    val isSpeakerOn: Boolean = true,
    val error: String? = null,
    val safetyAlert: SafetyAlert? = null
)

data class SafetyAlert(val message: String, val severity: String)

@HiltViewModel
class CallViewModel @Inject constructor(
    private val agoraManager: AgoraManager,
    private val callRepository: CallRepository,
    private val hybridMonitor: HybridSafetyMonitor,
    private val firestore: FirebaseFirestore
) : ViewModel() {

    private val _uiState = mutableStateOf(CallUiState())
    val uiState: State<CallUiState> = _uiState

    private var timerJob: Job? = null
    private var coinDeductionJob: Job? = null
    
    private val _callTextBuffer = MutableStateFlow("")
    private var analysisJob: Job? = null
    private var currentSessionId: String? = null

    private val eventHandler = object : IRtcEngineEventHandler() {
        override fun onJoinChannelSuccess(channel: String?, uid: Int, elapsed: Int) {
            _uiState.value = _uiState.value.copy(isJoined = true)
            currentSessionId = channel
            startTimer()
        }

        override fun onUserJoined(uid: Int, elapsed: Int) {
            _uiState.value = _uiState.value.copy(remoteUid = uid)
            startCoinDeduction()
        }

        override fun onUserOffline(uid: Int, reason: Int) {
            _uiState.value = _uiState.value.copy(remoteUid = null)
            endCall()
        }

        override fun onError(err: Int) {
            _uiState.value = _uiState.value.copy(error = "Agora Error: $err")
        }
    }

    fun initCall(context: Context, channelName: String, uid: Int, token: String) {
        agoraManager.init(context, Constants.AGORA_APP_ID, eventHandler)
        agoraManager.joinChannel(token, channelName, uid)
    }

    private fun startTimer() {
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            while (true) {
                delay(1000)
                _uiState.value = _uiState.value.copy(durationSeconds = _uiState.value.durationSeconds + 1)
            }
        }
    }

    private fun startCoinDeduction() {
        coinDeductionJob?.cancel()
        coinDeductionJob = viewModelScope.launch {
            while (true) {
                delay(60000) // Deduct every minute
                // In a real app, you'd call a repository here
                // callRepository.deductCoins(...)
                _uiState.value = _uiState.value.copy(coinsSpent = _uiState.value.coinsSpent + Constants.DEFAULT_CALL_RATE)
            }
        }
    }

    fun toggleMute() {
        val nextMute = !_uiState.value.isMuted
        agoraManager.muteLocalAudio(nextMute)
        _uiState.value = _uiState.value.copy(isMuted = nextMute)
    }

    fun toggleVideo() {
        val nextVideoDisable = !_uiState.value.isVideoDisabled
        agoraManager.muteLocalVideo(nextVideoDisable)
        _uiState.value = _uiState.value.copy(isVideoDisabled = nextVideoDisable)
    }

    fun switchCamera() {
        agoraManager.switchCamera()
    }

    fun toggleSpeaker() {
        val nextSpeaker = !_uiState.value.isSpeakerOn
        agoraManager.setEnableSpeakerphone(nextSpeaker)
        _uiState.value = _uiState.value.copy(isSpeakerOn = nextSpeaker)
    }

    fun onCallTextUpdate(text: String) {
        if (text.isBlank()) return
        _callTextBuffer.value += " $text"

        // Debounce: analyze after 3 seconds of silence
        analysisJob?.cancel()
        analysisJob = viewModelScope.launch {
            delay(3000)
            analyzeBuffer()
        }
    }

    private suspend fun analyzeBuffer() {
        val buffer = _callTextBuffer.value.trim()
        if (buffer.length < 20) return

        val result = hybridMonitor.analyzeContent(buffer, "voice_call")

        when (result) {
            is SafetyResult.Violation -> {
                // Show warning banner
                _uiState.value = _uiState.value.copy(
                    safetyAlert = SafetyAlert(
                        message = buildWarningMessage(result.violationType),
                        severity = result.severity
                    )
                )

                // Auto-log HIGH/CRITICAL to Firestore
                if (result.severity in listOf("HIGH", "CRITICAL")) {
                    logViolation(buffer, result)
                }

                // CRITICAL → auto-end call after 5 seconds
                if (result.severity == "CRITICAL") {
                    viewModelScope.launch {
                        delay(5000)
                        endCall()
                    }
                }
            }
            else -> { /* clean */ }
        }

        _callTextBuffer.value = ""
    }

    private fun buildWarningMessage(type: String): String = when (type) {
        "OFF_PLATFORM_PAYMENT" ->
            "⚠️ Off-platform payments are not allowed. All payments must go through Friendoo wallet."
        "PERSONAL_INFO_REQUEST" ->
            "⚠️ Do not share personal contact details. Stay on Friendoo for your safety."
        "INAPPROPRIATE_CONTENT" ->
            "⚠️ Please keep conversations respectful and appropriate."
        "HARASSMENT" ->
            "⚠️ This conversation is being monitored. Please be respectful."
        else -> "⚠️ Policy reminder"
    }

    private suspend fun logViolation(text: String, violation: SafetyResult.Violation) {
        firestore.collection("autoFlaggedViolations").add(
            hashMapOf(
                "callSessionId"   to (currentSessionId ?: ""),
                "flaggedText"     to text,
                "violationType"   to violation.violationType,
                "severity"        to violation.severity,
                "matchedText"     to violation.matchedText,
                "flaggedBy"       to "hybrid_ai",
                "createdAt"       to FieldValue.serverTimestamp(),
                "reviewedByAdmin" to false
            )
        )
    }

    fun dismissSafetyAlert() {
        _uiState.value = _uiState.value.copy(safetyAlert = null)
    }

    fun endCall() {
        timerJob?.cancel()
        coinDeductionJob?.cancel()
        agoraManager.leaveChannel()
        agoraManager.destroy()
        _uiState.value = _uiState.value.copy(isJoined = false, remoteUid = null)
    }

    override fun onCleared() {
        super.onCleared()
        endCall()
    }

    fun setupLocalVideo(context: Context) = agoraManager.setupLocalVideo(context)
    fun setupRemoteVideo(context: Context, uid: Int) = agoraManager.setupRemoteVideo(context, uid)
}
