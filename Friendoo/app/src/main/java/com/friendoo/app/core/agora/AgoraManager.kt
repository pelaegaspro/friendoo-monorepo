package com.friendoo.app.core.agora

import android.content.Context
import android.util.Log
import android.view.SurfaceView
import com.friendoo.app.core.model.CallType
import io.agora.rtc2.ChannelMediaOptions
import io.agora.rtc2.Constants
import io.agora.rtc2.IRtcEngineEventHandler
import io.agora.rtc2.RtcEngine
import io.agora.rtc2.RtcEngineConfig
import io.agora.rtc2.video.VideoCanvas
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AgoraManager @Inject constructor() {

    enum class AgoraState {
        IDLE,
        INITIALIZING,
        READY,
        JOINING,
        JOINED,
        RECONNECTING,
        LEAVING,
        DESTROYING,
        DESTROYED,
        FAILED
    }

    private var rtcEngine: RtcEngine? = null
    private var state: AgoraState = AgoraState.IDLE

    @Synchronized
    fun getCurrentState(): AgoraState = state

    @Synchronized
    fun init(context: Context, appId: String, handler: IRtcEngineEventHandler) {
        val current = state
        if (current == AgoraState.INITIALIZING) {
            Log.w("AgoraManager", "Initialization already in progress.")
            return
        }
        if (current != AgoraState.IDLE && current != AgoraState.DESTROYED && current != AgoraState.FAILED) {
            Log.d("AgoraManager", "Engine active (state = $current). Tearing down before re-initialization.")
            destroyInternal()
        }

        state = AgoraState.INITIALIZING
        Log.d("AgoraManager", "State transition: $current -> INITIALIZING")

        try {
            val config = RtcEngineConfig()
            config.mContext = context.applicationContext
            config.mAppId = appId
            config.mEventHandler = handler
            rtcEngine = RtcEngine.create(config)

            rtcEngine?.setChannelProfile(Constants.CHANNEL_PROFILE_COMMUNICATION)
            rtcEngine?.enableAudio()
            rtcEngine?.setDefaultAudioRoutetoSpeakerphone(true)

            state = AgoraState.READY
            Log.d("AgoraManager", "State transition: INITIALIZING -> READY")
        } catch (e: Exception) {
            Log.e("AgoraManager", "Error initializing Agora: ${e.message}", e)
            rtcEngine = null
            state = AgoraState.FAILED
            Log.d("AgoraManager", "State transition: INITIALIZING -> FAILED")
        }
    }

    fun enableVideo() {
        rtcEngine?.enableVideo()
        rtcEngine?.enableLocalVideo(true)
        rtcEngine?.setVideoEncoderConfiguration(
            io.agora.rtc2.video.VideoEncoderConfiguration().apply {
                dimensions = io.agora.rtc2.video.VideoEncoderConfiguration.VideoDimensions(640, 360)
                frameRate = io.agora.rtc2.video.VideoEncoderConfiguration.FRAME_RATE.FRAME_RATE_FPS_15.getValue()
                bitrate = io.agora.rtc2.video.VideoEncoderConfiguration.STANDARD_BITRATE
                orientationMode = io.agora.rtc2.video.VideoEncoderConfiguration.ORIENTATION_MODE.ORIENTATION_MODE_ADAPTIVE
            }
        )
    }

    fun disableVideo() {
        rtcEngine?.stopPreview()
        rtcEngine?.enableLocalVideo(false)
        rtcEngine?.disableVideo()
    }

    @Synchronized
    fun joinChannel(token: String, channelName: String, uid: Int, callType: CallType = CallType.AUDIO) {
        val current = state
        if (current != AgoraState.READY) {
            Log.e("AgoraManager", "Cannot join channel: Engine is not READY (current state = $current)")
            return
        }
        state = AgoraState.JOINING
        Log.d("AgoraManager", "State transition: READY -> JOINING")

        val options = ChannelMediaOptions().apply {
            autoSubscribeAudio = true
            autoSubscribeVideo = callType == CallType.VIDEO
            publishMicrophoneTrack = true
            publishCameraTrack = callType == CallType.VIDEO
            clientRoleType = Constants.CLIENT_ROLE_BROADCASTER
        }

        try {
            val res = rtcEngine?.joinChannel(token, channelName, uid, options)
            if (res != 0) {
                Log.e("AgoraManager", "joinChannel failed with error code $res")
                state = AgoraState.FAILED
                Log.d("AgoraManager", "State transition: JOINING -> FAILED")
            }
        } catch (e: Exception) {
            Log.e("AgoraManager", "joinChannel exception: ${e.message}", e)
            state = AgoraState.FAILED
            Log.d("AgoraManager", "State transition: JOINING -> FAILED")
        }
    }

    @Synchronized
    fun notifyJoined() {
        val current = state
        if (current == AgoraState.JOINING || current == AgoraState.RECONNECTING) {
            state = AgoraState.JOINED
            Log.d("AgoraManager", "State transition: $current -> JOINED")
        }
    }

    @Synchronized
    fun notifyReconnecting() {
        val current = state
        if (current == AgoraState.JOINED) {
            state = AgoraState.RECONNECTING
            Log.d("AgoraManager", "State transition: JOINED -> RECONNECTING")
        }
    }

    @Synchronized
    fun notifyConnectionFailed() {
        val current = state
        state = AgoraState.FAILED
        Log.d("AgoraManager", "State transition: $current -> FAILED")
    }

    @Synchronized
    fun leaveChannel() {
        val current = state
        if (current != AgoraState.JOINED && current != AgoraState.JOINING && current != AgoraState.RECONNECTING) {
            Log.w("AgoraManager", "leaveChannel ignored: current state = $current is not joined/joining/reconnecting")
            return
        }
        state = AgoraState.LEAVING
        Log.d("AgoraManager", "State transition: $current -> LEAVING")

        try {
            rtcEngine?.leaveChannel()
            state = AgoraState.READY
            Log.d("AgoraManager", "State transition: LEAVING -> READY")
        } catch (e: Exception) {
            Log.w("AgoraManager", "leaveChannel exception: ${e.message}")
            state = AgoraState.FAILED
            Log.d("AgoraManager", "State transition: LEAVING -> FAILED")
        }
    }

    @Synchronized
    fun destroy() {
        destroyInternal()
    }

    private fun destroyInternal() {
        val current = state
        if (current == AgoraState.DESTROYED || current == AgoraState.IDLE) {
            return
        }
        state = AgoraState.DESTROYING
        Log.d("AgoraManager", "State transition: $current -> DESTROYING")

        try {
            rtcEngine?.leaveChannel()
        } catch (e: Exception) {
            Log.w("AgoraManager", "leaveChannel in destroy exception: ${e.message}")
        }

        if (rtcEngine != null) {
            try {
                RtcEngine.destroy()
            } catch (e: Exception) {
                Log.w("AgoraManager", "destroyEngine exception: ${e.message}")
            }
            rtcEngine = null
        }
        state = AgoraState.DESTROYED
        Log.d("AgoraManager", "State transition: DESTROYING -> DESTROYED")
    }

    fun muteLocalAudio(muted: Boolean) {
        rtcEngine?.muteLocalAudioStream(muted)
    }

    fun muteLocalVideo(muted: Boolean) {
        rtcEngine?.muteLocalVideoStream(muted)
    }

    fun setEnableSpeakerphone(enabled: Boolean) {
        rtcEngine?.setEnableSpeakerphone(enabled)
    }

    fun setupLocalVideo(surfaceView: SurfaceView) {
        rtcEngine?.setupLocalVideo(VideoCanvas(surfaceView, Constants.RENDER_MODE_HIDDEN, 0))
        rtcEngine?.startPreview()
    }

    fun setupRemoteVideo(surfaceView: SurfaceView, remoteUid: Int) {
        rtcEngine?.setupRemoteVideo(VideoCanvas(surfaceView, Constants.RENDER_MODE_HIDDEN, remoteUid))
    }

    fun switchCamera() {
        rtcEngine?.switchCamera()
    }
}
