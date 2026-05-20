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

    private var rtcEngine: RtcEngine? = null

    fun init(context: Context, appId: String, handler: IRtcEngineEventHandler) {
        if (rtcEngine != null) return

        try {
            val config = RtcEngineConfig()
            config.mContext = context
            config.mAppId = appId
            config.mEventHandler = handler
            rtcEngine = RtcEngine.create(config)

            rtcEngine?.setChannelProfile(Constants.CHANNEL_PROFILE_COMMUNICATION)
            rtcEngine?.enableAudio()
            rtcEngine?.setDefaultAudioRoutetoSpeakerphone(true)
        } catch (e: Exception) {
            Log.e("AgoraManager", "Error initializing Agora: ${e.message}")
        }
    }

    /**
     * Enables video mode on the Agora engine.
     * Must be called before joinChannel for video calls.
     */
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

    /**
     * Disables video mode (for audio-only calls).
     */
    fun disableVideo() {
        rtcEngine?.stopPreview()
        rtcEngine?.enableLocalVideo(false)
        rtcEngine?.disableVideo()
    }

    /**
     * Joins a channel with the appropriate media options based on call type.
     */
    fun joinChannel(token: String, channelName: String, uid: Int, callType: CallType = CallType.AUDIO) {
        val options = ChannelMediaOptions().apply {
            autoSubscribeAudio = true
            autoSubscribeVideo = callType == CallType.VIDEO
            publishMicrophoneTrack = true
            publishCameraTrack = callType == CallType.VIDEO
            clientRoleType = Constants.CLIENT_ROLE_BROADCASTER
        }
        rtcEngine?.joinChannel(token, channelName, uid, options)
    }

    fun leaveChannel() {
        rtcEngine?.leaveChannel()
    }

    fun destroy() {
        RtcEngine.destroy()
        rtcEngine = null
    }

    fun muteLocalAudio(muted: Boolean) {
        rtcEngine?.muteLocalAudioStream(muted)
    }

    /**
     * Mutes local video stream without disabling the camera.
     */
    fun muteLocalVideo(muted: Boolean) {
        rtcEngine?.muteLocalVideoStream(muted)
    }

    fun setEnableSpeakerphone(enabled: Boolean) {
        rtcEngine?.setEnableSpeakerphone(enabled)
    }

    /**
     * Sets up the local video preview on the given SurfaceView.
     */
    fun setupLocalVideo(surfaceView: SurfaceView) {
        rtcEngine?.setupLocalVideo(VideoCanvas(surfaceView, Constants.RENDER_MODE_HIDDEN, 0))
        rtcEngine?.startPreview()
    }

    /**
     * Sets up a remote user's video on the given SurfaceView.
     */
    fun setupRemoteVideo(surfaceView: SurfaceView, remoteUid: Int) {
        rtcEngine?.setupRemoteVideo(VideoCanvas(surfaceView, Constants.RENDER_MODE_HIDDEN, remoteUid))
    }

    /**
     * Switches between front and rear cameras.
     */
    fun switchCamera() {
        rtcEngine?.switchCamera()
    }
}
