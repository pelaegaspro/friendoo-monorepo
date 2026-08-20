package com.friendoo.app.presentation.call

import android.Manifest
import android.view.SurfaceView
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.friendoo.app.core.model.CallType
import com.friendoo.app.presentation.components.FriendooAvatar
import com.friendoo.app.presentation.theme.*

@Composable
fun CallScreen(
    viewModel: CallViewModel,
    receiverId: String,
    otherUserAlias: String = "Host",
    otherUserAvatarSeed: String = "",
    ratePerMinute: Int = 5,
    otherUserColor: String = "#3700B3",
    callType: CallType = CallType.AUDIO,
    existingCallId: String? = null,
    onEndCall: (String) -> Unit
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState
    var showRatingDialog by remember { mutableStateOf(false) }

    LaunchedEffect(callType) {
        viewModel.setCallType(callType)
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val audioGranted = permissions[Manifest.permission.RECORD_AUDIO] == true
        val videoGranted = permissions[Manifest.permission.CAMERA] == true

        if (audioGranted && videoGranted) {
            if (!existingCallId.isNullOrBlank()) {
                viewModel.joinExistingCall(context, existingCallId, ratePerMinute, callType)
            } else {
                viewModel.startCall(context, receiverId, otherUserAlias, ratePerMinute, callType)
            }
        }
    }

    LaunchedEffect(key1 = receiverId, key2 = existingCallId) {
        val perms = arrayOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.CAMERA
        )
        permissionLauncher.launch(perms)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(listOf(MidnightPlum, DeepIndigo, MidnightPlum))
            )
    ) {
        // Video call UI
        if (callType == CallType.VIDEO && uiState.isJoined) {
            RemoteVideoView(
                agoraManager = viewModel.getAgoraManager(),
                remoteUid = uiState.remoteUid,
                modifier = Modifier.fillMaxSize()
            )

            LocalVideoView(
                agoraManager = viewModel.getAgoraManager(),
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(top = 48.dp, end = 16.dp)
                    .size(width = 120.dp, height = 160.dp)
            )

            Column(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(24.dp)
            ) {
                Text(
                    text = otherUserAlias,
                    color = Color.White,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = formatDuration(uiState.durationSeconds),
                    color = Color.White.copy(alpha = 0.8f),
                    style = MaterialTheme.typography.bodyMedium
                )
                Text(
                    text = "Coins: ${uiState.coinsSpent}",
                    color = Color.White.copy(alpha = 0.7f),
                    style = MaterialTheme.typography.bodySmall
                )
            }

            Row(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 64.dp)
                    .fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                CallControlButton(
                    icon = if (uiState.isCameraOff) Icons.Default.VideocamOff else Icons.Default.Videocam,
                    containerColor = if (uiState.isCameraOff) ErrorRed else SurfaceDark,
                    contentColor = if (uiState.isCameraOff) Color.White else LavenderGray,
                    onClick = { viewModel.toggleCamera() }
                )
                CallControlButton(
                    icon = if (uiState.isMuted) Icons.Default.MicOff else Icons.Default.Mic,
                    containerColor = if (uiState.isMuted) ErrorRed else SurfaceDark,
                    contentColor = if (uiState.isMuted) Color.White else LavenderGray,
                    onClick = { viewModel.toggleMute() }
                )
                FloatingActionButton(
                    onClick = {
                        viewModel.endCall()
                        showRatingDialog = true
                    },
                    containerColor = ErrorRed,
                    contentColor = Color.White,
                    shape = CircleShape,
                    modifier = Modifier.size(72.dp)
                ) {
                    Icon(Icons.Default.CallEnd, contentDescription = "End Call", modifier = Modifier.size(32.dp))
                }
                CallControlButton(
                    icon = Icons.Default.Cameraswitch,
                    containerColor = SurfaceDark,
                    contentColor = LavenderGray,
                    onClick = { viewModel.switchCamera() }
                )
                CallControlButton(
                    icon = if (uiState.isSpeakerOn) Icons.Default.VolumeUp else Icons.Default.VolumeOff,
                    containerColor = if (uiState.isSpeakerOn) Violet else SurfaceDark,
                    contentColor = if (uiState.isSpeakerOn) Color.White else LavenderGray,
                    onClick = { viewModel.toggleSpeaker() }
                )
            }

        } else {
            // Audio call UI
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                FriendooAvatar(
                    avatarSeed = otherUserAvatarSeed.ifBlank { receiverId },
                    size = 140.dp
                )

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    text = otherUserAlias,
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = NearWhite
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = when {
                        uiState.isJoined -> "On Call"
                        uiState.isConnecting -> if (callType == CallType.VIDEO) "Setting up video call..." else "Connecting..."
                        uiState.error != null -> "Connection failed"
                        else -> "Connecting you..."
                    },
                    style = MaterialTheme.typography.bodyLarge,
                    color = when {
                        uiState.isJoined -> Mint
                        uiState.error != null -> ErrorRed
                        else -> LavenderGray
                    },
                    modifier = Modifier.padding(horizontal = 32.dp),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = formatDuration(uiState.durationSeconds),
                    style = MaterialTheme.typography.displayMedium,
                    fontWeight = FontWeight.Light,
                    color = Color.White
                )

                Spacer(modifier = Modifier.height(8.dp))

                Surface(
                    shape = PillShape,
                    color = Violet.copy(alpha = 0.2f)
                ) {
                    Text(
                        text = "Coins: ${uiState.coinsSpent}",
                        color = VioletLight,
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
                    )
                }
            }

            // Audio controls
            Row(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 64.dp)
                    .fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                CallControlButton(
                    icon = if (uiState.isMuted) Icons.Default.MicOff else Icons.Default.Mic,
                    containerColor = if (uiState.isMuted) ErrorRed else SurfaceDark,
                    contentColor = if (uiState.isMuted) Color.White else LavenderGray,
                    onClick = { viewModel.toggleMute() }
                )
                FloatingActionButton(
                    onClick = {
                        viewModel.endCall()
                        showRatingDialog = true
                    },
                    containerColor = ErrorRed,
                    contentColor = Color.White,
                    shape = CircleShape,
                    modifier = Modifier.size(72.dp)
                ) {
                    Icon(Icons.Default.CallEnd, contentDescription = "End Call", modifier = Modifier.size(32.dp))
                }
                CallControlButton(
                    icon = if (uiState.isSpeakerOn) Icons.Default.VolumeUp else Icons.Default.VolumeOff,
                    containerColor = if (uiState.isSpeakerOn) Violet else SurfaceDark,
                    contentColor = if (uiState.isSpeakerOn) Color.White else LavenderGray,
                    onClick = { viewModel.toggleSpeaker() }
                )
            }
        }

        // Report Button
        var showReportSheet by remember { mutableStateOf(false) }
        IconButton(
            onClick = { showReportSheet = true },
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(24.dp)
                .background(ErrorRed.copy(alpha = 0.15f), CircleShape)
        ) {
            Icon(Icons.Default.Flag, contentDescription = "Report", tint = ErrorRed)
        }

        if (showRatingDialog) {
            com.friendoo.app.presentation.rating.RatingDialog(
                hostId = receiverId,
                hostAlias = otherUserAlias,
                onDismiss = { onEndCall(receiverId) },
                onSubmitted = { onEndCall(receiverId) }
            )
        }

        if (showReportSheet) {
            com.friendoo.app.presentation.report.ReportBottomSheet(
                reportedUserId = receiverId,
                reportedAlias = otherUserAlias,
                sessionId = receiverId,
                onDismiss = { showReportSheet = false }
            )
        }
    }
}

@Composable
private fun LocalVideoView(
    agoraManager: com.friendoo.app.core.agora.AgoraManager,
    modifier: Modifier = Modifier
) {
    AndroidView(
        factory = { context ->
            SurfaceView(context).apply {
                agoraManager.setupLocalVideo(this)
            }
        },
        modifier = modifier
    )
}

@Composable
private fun RemoteVideoView(
    agoraManager: com.friendoo.app.core.agora.AgoraManager,
    remoteUid: Int?,
    modifier: Modifier = Modifier
) {
    if (remoteUid == null) return
    AndroidView(
        factory = { context ->
            SurfaceView(context).apply {
                agoraManager.setupRemoteVideo(this, remoteUid)
            }
        },
        update = { surfaceView ->
            agoraManager.setupRemoteVideo(surfaceView, remoteUid)
        },
        modifier = modifier
    )
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
