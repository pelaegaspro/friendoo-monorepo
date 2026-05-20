package com.friendoo.app.presentation.call

import android.content.Context
import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.friendoo.app.core.agora.AgoraManager
import com.friendoo.app.core.model.CallType
import com.friendoo.app.core.utils.Constants
import com.friendoo.app.data.repository.CallRepository
import com.friendoo.app.domain.usecase.InitiateCallUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import io.agora.rtc2.IRtcEngineEventHandler
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CallUiState(
    val callType: CallType = CallType.AUDIO,
    val isJoined: Boolean = false,
    val isConnecting: Boolean = false,
    val remoteUid: Int? = null,
    val durationSeconds: Long = 0,
    val coinsSpent: Int = 0,
    val isMuted: Boolean = false,
    val isSpeakerOn: Boolean = true,
    val isCameraOff: Boolean = false,
    val isFrontCamera: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class CallViewModel @Inject constructor(
    private val agoraManager: AgoraManager,
    private val callRepository: CallRepository,
    private val initiateCallUseCase: InitiateCallUseCase
) : ViewModel() {

    private val _uiState = mutableStateOf(CallUiState())
    val uiState: State<CallUiState> = _uiState

    private var timerJob: Job? = null
    private var coinDeductionJob: Job? = null

    private var currentCallId: String? = null
    private var hasMarkedActive = false

    private val eventHandler = object : IRtcEngineEventHandler() {
        override fun onJoinChannelSuccess(channel: String?, uid: Int, elapsed: Int) {
            _uiState.value = _uiState.value.copy(isJoined = true, isConnecting = false)
            markCurrentCallActive()
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
            _uiState.value = _uiState.value.copy(
                error = "Agora Error: $err",
                isConnecting = false
            )
        }
    }

    /**
     * Sets the call type before starting the call.
     */
    fun setCallType(callType: CallType) {
        _uiState.value = _uiState.value.copy(callType = callType)
    }

    /**
     * Initiates the full call flow:
     * 1. Creates a Firestore call document
     * 2. Fetches an Agora token from the Cloud Function
     * 3. Initializes the Agora engine and joins the channel
     */
    fun startCall(
        context: Context,
        receiverId: String,
        receiverAlias: String,
        ratePerMinute: Int,
        callType: CallType = _uiState.value.callType
    ) {
        if (_uiState.value.isConnecting || _uiState.value.isJoined) return

        hasMarkedActive = false
        _uiState.value = _uiState.value.copy(
            isConnecting = true,
            error = null,
            callType = callType,
            remoteUid = null,
            durationSeconds = 0,
            coinsSpent = 0,
            isMuted = false,
            isSpeakerOn = true,
            isCameraOff = false
        )

        viewModelScope.launch {
            val result = initiateCallUseCase(receiverId, receiverAlias, ratePerMinute, callType)
            result.fold(
                onSuccess = { callInit ->
                    currentCallId = callInit.callId
                    agoraManager.init(context, callInit.credentials.appId, eventHandler)

                    if (callType == CallType.VIDEO) {
                        agoraManager.enableVideo()
                    } else {
                        agoraManager.disableVideo()
                    }

                    agoraManager.joinChannel(
                        callInit.credentials.token,
                        callInit.credentials.channel,
                        0,
                        callType
                    )
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        error = error.message ?: "Failed to start call",
                        isConnecting = false
                    )
                }
            )
        }
    }

    /**
     * Direct initialization when token/channel are already known (e.g., answering an incoming call).
     */
    fun initCall(context: Context, channelName: String, uid: Int, token: String, appId: String, callType: CallType = CallType.AUDIO) {
        currentCallId = channelName
        hasMarkedActive = false
        _uiState.value = _uiState.value.copy(isConnecting = true, error = null, callType = callType)
        agoraManager.init(context, appId, eventHandler)
        if (callType == CallType.VIDEO) {
            agoraManager.enableVideo()
        } else {
            agoraManager.disableVideo()
        }
        agoraManager.joinChannel(token, channelName, uid, callType)
    }

    private fun markCurrentCallActive() {
        val callId = currentCallId ?: return
        if (hasMarkedActive) return
        hasMarkedActive = true
        viewModelScope.launch {
            callRepository.markCallActive(callId).onFailure { error ->
                _uiState.value = _uiState.value.copy(
                    error = error.message ?: "Call connected, but status sync failed."
                )
            }
        }
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
            val rate = if (_uiState.value.callType == CallType.VIDEO) Constants.DEFAULT_VIDEO_RATE else Constants.DEFAULT_AUDIO_RATE
            while (true) {
                delay(60000) // Deduct every minute
                _uiState.value = _uiState.value.copy(coinsSpent = _uiState.value.coinsSpent + rate)
            }
        }
    }

    fun toggleMute() {
        val nextMute = !_uiState.value.isMuted
        agoraManager.muteLocalAudio(nextMute)
        _uiState.value = _uiState.value.copy(isMuted = nextMute)
    }

    fun toggleSpeaker() {
        val nextSpeaker = !_uiState.value.isSpeakerOn
        agoraManager.setEnableSpeakerphone(nextSpeaker)
        _uiState.value = _uiState.value.copy(isSpeakerOn = nextSpeaker)
    }

    /**
     * Toggles the camera on/off (video calls only).
     */
    fun toggleCamera() {
        val nextOff = !_uiState.value.isCameraOff
        agoraManager.muteLocalVideo(nextOff)
        _uiState.value = _uiState.value.copy(isCameraOff = nextOff)
    }

    /**
     * Switches between front and rear cameras (video calls only).
     */
    fun switchCamera() {
        agoraManager.switchCamera()
        _uiState.value = _uiState.value.copy(isFrontCamera = !_uiState.value.isFrontCamera)
    }

    fun getAgoraManager(): AgoraManager = agoraManager

    fun endCall() {
        timerJob?.cancel()
        coinDeductionJob?.cancel()
        agoraManager.leaveChannel()
        agoraManager.destroy()
        _uiState.value = _uiState.value.copy(isJoined = false, isConnecting = false, remoteUid = null)
        hasMarkedActive = false

        // Update Firestore call status
        currentCallId?.let { callId ->
            viewModelScope.launch {
                callRepository.endCall(callId)
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        endCall()
    }
}
