package com.friendoo.app.presentation.call

import android.Manifest
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.friendoo.app.presentation.call.components.SafetyAlertBanner
import com.friendoo.app.presentation.components.AnonymousAvatar

@Composable
fun CallScreen(
    viewModel: CallViewModel,
    channelName: String,
    uid: Int,
    token: String,
    otherUserAlias: String = "Host",
    otherUserColor: String = "#3700B3",
    onEndCall: () -> Unit
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState
    var showRatingDialog by remember { mutableStateOf(false) }

    // ── STT & PERMISSION LOGIC ──
    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            viewModel.initCall(context, channelName, uid, token)
        }
    }

    DisposableEffect(Unit) {
        val recognizer = SpeechRecognizer.createSpeechRecognizer(context)
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-IN")
        }

        val listener = object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {}
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {}
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() {
                try { recognizer.startListening(intent) } catch (e: Exception) {}
            }
            override fun onError(error: Int) {
                if (error != SpeechRecognizer.ERROR_CLIENT) {
                    try { recognizer.startListening(intent) } catch (e: Exception) {}
                }
            }
            override fun onResults(results: Bundle?) {
                val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                matches?.firstOrNull()?.let { viewModel.onCallTextUpdate(it) }
                try { recognizer.startListening(intent) } catch (e: Exception) {}
            }
            override fun onPartialResults(partialResults: Bundle?) {
                val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                matches?.firstOrNull()?.let { viewModel.onCallTextUpdate(it) }
            }
            override fun onEvent(eventType: Int, params: Bundle?) {}
        }

        recognizer.setRecognitionListener(listener)
        recognizer.startListening(intent)

        onDispose {
            recognizer.destroy()
        }
    }

    LaunchedEffect(key1 = channelName) {
        permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
        // Ensure video is disabled for audio-only anonymous calls
        viewModel.toggleVideo()
    }

    Box(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        
        // Background Gradient or Pattern could go here
        
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            AnonymousAvatar(
                alias = otherUserAlias,
                avatarColorHex = otherUserColor,
                size = 140.dp,
                fontSize = 48
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Text(
                text = otherUserAlias,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            
            Text(
                text = if (uiState.isJoined) "On Call" else "Connecting you... she'll answer shortly",
                style = MaterialTheme.typography.bodyLarge,
                color = if (uiState.isJoined) Color.Green else Color.Gray,
                modifier = Modifier.padding(horizontal = 32.dp),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = formatDuration(uiState.durationSeconds),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Light
            )
        }

        // Call Stats (Top Left)
        Column(
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(24.dp)
        ) {
            Text(
                text = "Coins Spent: ${uiState.coinsSpent}",
                color = MaterialTheme.colorScheme.primary,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }

        // Safety Report Button
        var showReportSheet by remember { mutableStateOf(false) }
        
        IconButton(
            onClick = { showReportSheet = true },
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(24.dp)
                .background(Color.Red.copy(alpha = 0.1f), CircleShape)
        ) {
            Icon(Icons.Default.AccountCircle, contentDescription = "Report", tint = Color.Red)
        }

        // Controls
        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 64.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            CallControlButton(
                icon = if (uiState.isMuted) Icons.Default.Close else Icons.Default.Check,
                containerColor = if (uiState.isMuted) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.surfaceVariant,
                contentColor = if (uiState.isMuted) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                onClick = { viewModel.toggleMute() }
            )

            FloatingActionButton(
                onClick = {
                    viewModel.endCall()
                    showRatingDialog = true
                },
                containerColor = Color.Red,
                contentColor = Color.White,
                shape = CircleShape,
                modifier = Modifier.size(72.dp)
            ) {
                Icon(Icons.Default.Close, contentDescription = "End Call", modifier = Modifier.size(32.dp))
            }

            CallControlButton(
                icon = if (uiState.isSpeakerOn) Icons.Default.Star else Icons.Default.Refresh,
                containerColor = MaterialTheme.colorScheme.surfaceVariant,
                contentColor = MaterialTheme.colorScheme.onSurfaceVariant,
                onClick = { viewModel.toggleSpeaker() }
            )
        }

        if (showRatingDialog) {
            com.friendoo.app.presentation.rating.RatingDialog(
                hostId = channelName.substringAfter("host_"), // Extracting hostId from channel
                hostAlias = otherUserAlias,
                onDismiss = onEndCall,
                onSubmitted = onEndCall
            )
        }

        if (showReportSheet) {
            com.friendoo.app.presentation.report.ReportBottomSheet(
                reportedUserId = "host_$channelName", // Using channel as proxy for ID if not available
                reportedAlias = otherUserAlias,
                sessionId = channelName,
                onDismiss = { showReportSheet = false }
            )
        }

        // 🔗 SAFETY MONITOR BANNER
        AnimatedVisibility(
            visible = uiState.safetyAlert != null,
            enter = slideInVertically { -it } + fadeIn(),
            exit = slideOutVertically { -it } + fadeOut(),
            modifier = Modifier.align(Alignment.TopCenter).padding(top = 80.dp)
        ) {
            uiState.safetyAlert?.let { alert ->
                SafetyAlertBanner(
                    message = alert.message,
                    severity = alert.severity,
                    onDismiss = { viewModel.dismissSafetyAlert() }
                )
            }
        }
    }
}

@Composable
fun CallControlButton(
    icon: ImageVector,
    containerColor: Color,
    contentColor: Color = Color.White,
    onClick: () -> Unit
) {
    FilledIconButton(
        onClick = onClick,
        modifier = Modifier.size(64.dp),
        colors = IconButtonDefaults.filledIconButtonColors(
            containerColor = containerColor,
            contentColor = contentColor
        )
    ) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(28.dp))
    }
}

private fun formatDuration(seconds: Long): String {
    val mins = seconds / 60
    val secs = seconds % 60
    return "%02d:%02d".format(mins, secs)
}
