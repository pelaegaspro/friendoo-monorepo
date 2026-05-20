package com.friendoo.app.presentation.auth

import android.net.Uri
import android.widget.VideoView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import com.friendoo.app.R
import com.friendoo.app.presentation.theme.*

@Composable
fun SplashScreen(
    authToken: String?,
    onboardingCompleted: Boolean,
    isHost: Boolean,
    onNavigateToHome: () -> Unit,
    onNavigateToOnboarding: () -> Unit,
    onNavigateToLogin: () -> Unit,
    onNavigateToHostHome: () -> Unit
) {
    val context = LocalContext.current
    val currentAuthToken by rememberUpdatedState(authToken)
    val currentOnboardingCompleted by rememberUpdatedState(onboardingCompleted)
    val currentIsHost by rememberUpdatedState(isHost)
    val currentOnNavigateToHome by rememberUpdatedState(onNavigateToHome)
    val currentOnboardingCompletedNav by rememberUpdatedState(onNavigateToOnboarding)
    val currentOnNavigateToLogin by rememberUpdatedState(onNavigateToLogin)
    val currentOnNavigateToHostHome by rememberUpdatedState(onNavigateToHostHome)

    // Helper function to trigger final routing based on preferences
    val navigateToNextScreen = {
        when {
            currentAuthToken.isNullOrEmpty() -> currentOnNavigateToLogin()
            !currentOnboardingCompleted -> currentOnboardingCompletedNav()
            currentIsHost -> currentOnNavigateToHostHome()
            else -> currentOnNavigateToHome()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background),
        contentAlignment = Alignment.Center
    ) {
        AndroidView(
            factory = { ctx ->
                object : VideoView(ctx) {
                    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
                        val width = getDefaultSize(0, widthMeasureSpec)
                        val height = getDefaultSize(0, heightMeasureSpec)
                        setMeasuredDimension(width, height)
                    }
                }.apply {
                    val videoUri = Uri.parse("android.resource://${ctx.packageName}/${R.raw.friendoo_splash}")
                    setVideoURI(videoUri)
                    setOnPreparedListener { mediaPlayer ->
                        mediaPlayer.isLooping = false
                        start()
                    }
                    setOnCompletionListener {
                        navigateToNextScreen()
                    }
                    setOnErrorListener { _, _, _ ->
                        navigateToNextScreen()
                        true
                    }
                }
            },
            modifier = Modifier.fillMaxSize()
        )
    }
}
