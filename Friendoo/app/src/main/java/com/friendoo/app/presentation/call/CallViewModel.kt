package com.friendoo.app.presentation.call



import android.content.Context

import androidx.compose.runtime.State

import androidx.compose.runtime.mutableStateOf

import androidx.lifecycle.ViewModel

import androidx.lifecycle.viewModelScope

import com.friendoo.app.core.agora.AgoraManager

import com.friendoo.app.core.model.CallType

import com.friendoo.app.data.repository.CallRepository

import com.friendoo.app.domain.usecase.InitiateCallUseCase

import com.google.firebase.firestore.FirebaseFirestore

import com.google.firebase.firestore.ListenerRegistration

import dagger.hilt.android.lifecycle.HiltViewModel

import io.agora.rtc2.IRtcEngineEventHandler

import io.agora.rtc2.Constants

import kotlinx.coroutines.Dispatchers

import kotlinx.coroutines.Job

import kotlinx.coroutines.NonCancellable

import kotlinx.coroutines.delay

import kotlinx.coroutines.launch

import kotlinx.coroutines.withContext

import javax.inject.Inject



data class CallUiState(

    val callType: CallType = CallType.AUDIO,

    val isJoined: Boolean = false,

    val isConnecting: Boolean = false,

    val isRinging: Boolean = false,

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

    private val initiateCallUseCase: InitiateCallUseCase,

    private val firestore: FirebaseFirestore

) : ViewModel() {



    private val _uiState = mutableStateOf(CallUiState())

    val uiState: State<CallUiState> = _uiState



    private var timerJob: Job? = null

    private var callListener: ListenerRegistration? = null



    private var currentCallId: String? = null

    private var ratePerMinute: Int = 5

    private var hasMarkedActive = false

    private var remoteJoined = false

    private var isEnding = false



    private val eventHandler = object : IRtcEngineEventHandler() {

        override fun onJoinChannelSuccess(channel: String?, uid: Int, elapsed: Int) {

            viewModelScope.launch(Dispatchers.Main) {

                agoraManager.notifyJoined()

                _uiState.value = _uiState.value.copy(isJoined = true, isConnecting = false, isRinging = false)

                startTimer()

            }

        }



        override fun onUserJoined(uid: Int, elapsed: Int) {

            viewModelScope.launch(Dispatchers.Main) {

                remoteJoined = true

                _uiState.value = _uiState.value.copy(remoteUid = uid)

                markCurrentCallActive()

            }

        }



        override fun onUserOffline(uid: Int, reason: Int) {

            if (reason == Constants.USER_OFFLINE_QUIT || reason == Constants.USER_OFFLINE_DROPPED) {

                viewModelScope.launch(Dispatchers.Main) {

                    _uiState.value = _uiState.value.copy(remoteUid = null)

                    endCall()

                }

            }

        }



        override fun onError(err: Int) {

            viewModelScope.launch(Dispatchers.Main) {

                agoraManager.notifyConnectionFailed()

                _uiState.value = _uiState.value.copy(

                    error = "Call error: $err",

                    isConnecting = false,

                    isRinging = false

                )

            }

        }



        override fun onConnectionLost() {

            viewModelScope.launch(Dispatchers.Main) {

                agoraManager.notifyReconnecting()

            }

        }



        override fun onRejoinChannelSuccess(channel: String?, uid: Int, elapsed: Int) {

            viewModelScope.launch(Dispatchers.Main) {

                agoraManager.notifyJoined()

            }

        }

    }



    fun setCallType(callType: CallType) {

        _uiState.value = _uiState.value.copy(callType = callType)

    }



    private fun readCallState(data: Map<String, Any?>): String {

        return (data["state"] as? String) ?: (data["status"] as? String) ?: ""

    }



    private fun observeCall(callId: String, context: Context) {

        callListener?.remove()

        callListener = firestore.collection("calls").document(callId)

            .addSnapshotListener { snapshot, _ ->

                val data = snapshot?.data ?: return@addSnapshotListener

                val state = readCallState(data)



                // Sync server-authoritative coinsSpent directly

                val serverCoins = (data["coinsSpent"] as? Long)?.toInt() ?: 0

                _uiState.value = _uiState.value.copy(coinsSpent = serverCoins)



                when (state) {

                    "accepted", "connecting" -> {

                        if (!_uiState.value.isJoined && !_uiState.value.isConnecting) {

                            joinAgoraChannel(context, callId)

                        }

                    }

                    "active" -> {

                        if (!_uiState.value.isJoined && !_uiState.value.isConnecting) {

                            joinAgoraChannel(context, callId)

                        }

                        if (!hasMarkedActive && remoteJoined) {

                            markCurrentCallActive()

                        }

                    }

                    "rejected", "missed", "timeout", "failed", "ended" -> {

                        callListener?.remove()

                        callListener = null

                        _uiState.value = _uiState.value.copy(

                            isConnecting = false,

                            isRinging = false

                        )

                        endCall()

                    }

                }

            }

    }



    private fun joinAgoraChannel(context: Context, callId: String) {

        viewModelScope.launch {

            val result = callRepository.getJoinCredentials(callId)

            result.fold(

                onSuccess = { init ->

                    agoraManager.init(context.applicationContext, init.credentials.appId, eventHandler)

                    if (_uiState.value.callType == CallType.VIDEO) {

                        agoraManager.enableVideo()

                    } else {

                        agoraManager.disableVideo()

                    }

                    agoraManager.joinChannel(

                        init.credentials.token,

                        init.credentials.channel,

                        0,

                        _uiState.value.callType

                    )

                },

                onFailure = { error ->

                    _uiState.value = _uiState.value.copy(

                        error = error.message ?: "Failed to join call",

                        isConnecting = false,

                        isRinging = false

                    )

                }

            )

        }

    }



    fun startCall(

        context: Context,

        receiverId: String,

        receiverAlias: String,

        ratePerMinute: Int,

        callType: CallType = _uiState.value.callType

    ) {

        if (receiverId.isBlank() || receiverId == "quick") {

            _uiState.value = _uiState.value.copy(error = "Invalid host. Please try again.")

            return

        }

        if (_uiState.value.isConnecting || _uiState.value.isJoined || isEnding) return



        this.ratePerMinute = ratePerMinute

        hasMarkedActive = false

        remoteJoined = false

        isEnding = false



        _uiState.value = _uiState.value.copy(

            isConnecting = true,

            isRinging = true,

            error = null,

            callType = callType,

            remoteUid = null,

            durationSeconds = 0,

            coinsSpent = 0

        )



        viewModelScope.launch {

            val result = initiateCallUseCase.createRingingCall(receiverId, callType)

            result.fold(

                onSuccess = { init ->

                    currentCallId = init.callId

                    if (init.ratePerMinute > 0) this@CallViewModel.ratePerMinute = init.ratePerMinute

                    observeCall(init.callId, context)

                },

                onFailure = { error ->

                    _uiState.value = _uiState.value.copy(

                        error = error.message ?: "Failed to start call",

                        isConnecting = false,

                        isRinging = false

                    )

                }

            )

        }

    }



    fun joinExistingCall(

        context: Context,

        callId: String,

        ratePerMinute: Int,

        callType: CallType = _uiState.value.callType

    ) {

        if (callId.isBlank() || _uiState.value.isConnecting || _uiState.value.isJoined || isEnding) return



        this.ratePerMinute = ratePerMinute

        currentCallId = callId

        hasMarkedActive = false

        remoteJoined = false

        isEnding = false



        _uiState.value = _uiState.value.copy(

            isConnecting = true,

            isRinging = false,

            error = null,

            callType = callType

        )

        observeCall(callId, context)

    }



    private fun markCurrentCallActive() {

        val callId = currentCallId ?: return

        if (hasMarkedActive || !remoteJoined) return

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



    fun toggleCamera() {

        val nextOff = !_uiState.value.isCameraOff

        agoraManager.muteLocalVideo(nextOff)

        _uiState.value = _uiState.value.copy(isCameraOff = nextOff)

    }



    fun switchCamera() {

        agoraManager.switchCamera()

        _uiState.value = _uiState.value.copy(isFrontCamera = !_uiState.value.isFrontCamera)

    }



    fun getAgoraManager(): AgoraManager = agoraManager



    fun endCall() {

        if (isEnding) return

        isEnding = true

        timerJob?.cancel()

        callListener?.remove()

        callListener = null

        agoraManager.destroy()

        _uiState.value = _uiState.value.copy(

            isJoined = false,

            isConnecting = false,

            isRinging = false,

            remoteUid = null

        )



        val callId = currentCallId

        currentCallId = null

        hasMarkedActive = false

        remoteJoined = false



        if (!callId.isNullOrBlank()) {

            viewModelScope.launch {

                withContext(NonCancellable) {

                    callRepository.endCall(callId)

                }

            }

        }

    }



    override fun onCleared() {

        callListener?.remove()

        if (currentCallId != null && (_uiState.value.isJoined || _uiState.value.isConnecting || _uiState.value.isRinging)) {

            endCall()

        } else {

            agoraManager.destroy()

        }

        super.onCleared()

    }

}

