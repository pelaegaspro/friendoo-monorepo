package com.friendoo.app.core.agora

import android.content.Context
import android.util.Log
import android.view.SurfaceView
import android.view.View
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
    private var eventHandler: IRtcEngineEventHandler? = null

    fun init(context: Context, appId: String, handler: IRtcEngineEventHandler) {
        if (rtcEngine != null) return
        
        try {
            val config = RtcEngineConfig()
            config.mContext = context
            config.mAppId = appId
            config.mEventHandler = handler
            rtcEngine = RtcEngine.create(config)
            rtcEngine?.enableVideo()
            rtcEngine?.startPreview()
        } catch (e: Exception) {
            Log.e("AgoraManager", "Error initializing Agora: ${e.message}")
        }
    }

    fun joinChannel(token: String, channelName: String, uid: Int) {
        rtcEngine?.joinChannel(token, channelName, uid, null)
    }

    fun leaveChannel() {
        rtcEngine?.leaveChannel()
    }

    fun setupLocalVideo(context: Context): SurfaceView {
        val surfaceView = SurfaceView(context)
        rtcEngine?.setupLocalVideo(VideoCanvas(surfaceView, VideoCanvas.RENDER_MODE_HIDDEN, 0))
        return surfaceView
    }

    fun setupRemoteVideo(context: Context, uid: Int): SurfaceView {
        val surfaceView = SurfaceView(context)
        rtcEngine?.setupRemoteVideo(VideoCanvas(surfaceView, VideoCanvas.RENDER_MODE_HIDDEN, uid))
        return surfaceView
    }

    fun destroy() {
        RtcEngine.destroy()
        rtcEngine = null
    }

    fun muteLocalAudio(muted: Boolean) {
        rtcEngine?.muteLocalAudioStream(muted)
    }

    fun muteLocalVideo(muted: Boolean) {
        rtcEngine?.muteLocalVideoStream(muted)
    }

    fun switchCamera() {
        rtcEngine?.switchCamera()
    }

    fun setEnableSpeakerphone(enabled: Boolean) {
        rtcEngine?.setEnableSpeakerphone(enabled)
    }
}
