package com.friendoo.app.presentation.call

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.friendoo.app.data.model.Host
import com.friendoo.app.presentation.components.FriendooAvatar
import com.friendoo.app.presentation.theme.*
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.delay
import kotlinx.coroutines.tasks.await

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WaitingScreen(
    onMatched: (String, String, Int, String, String) -> Unit, // hostUid, hostAlias, ratePerMinute, callType, hostAvatarSeed
    onCancel: () -> Unit
) {
    val db = FirebaseFirestore.getInstance()
    var progress by remember { mutableStateOf(0f) }
    var secondsRemaining by remember { mutableStateOf(5) }
    var matchedHost by remember { mutableStateOf<Host?>(null) }

    // Curated local fallback hosts
    val fallbackHosts = remember {
        listOf(
            Host(uid = "mock_rashmi", alias = "Rashmi", avatarSeed = "Rashmi", ratePerAudioMinute = 5, ratePerVideoMinute = 10, supportsVideo = true, isOnline = true, callStatus = "available"),
            Host(uid = "mock_jasmine", alias = "jasmine", avatarSeed = "jasmine", ratePerAudioMinute = 6, ratePerVideoMinute = 12, supportsVideo = false, isOnline = true, callStatus = "available"),
            Host(uid = "mock_srikutty", alias = "Srikutty", avatarSeed = "Srikutty", ratePerAudioMinute = 5, ratePerVideoMinute = 10, supportsVideo = true, isOnline = true, callStatus = "available"),
            Host(uid = "mock_yalini", alias = "yalini", avatarSeed = "yalini", ratePerAudioMinute = 8, ratePerVideoMinute = 15, supportsVideo = true, isOnline = true, callStatus = "available"),
            Host(uid = "mock_mabaro", alias = "MABARO", avatarSeed = "MABARO", ratePerAudioMinute = 5, ratePerVideoMinute = 10, supportsVideo = false, isOnline = true, callStatus = "available")
        )
    }

    // Cycling names and avatar seeds during loading to represent live search
    val cycleNames = remember { listOf("Rashmi", "jasmine", "Srikutty", "love", "yalini", "MABARO", "Aswathy", "Sweety", "Angel", "Nisha") }
    val cycleSeeds = remember { listOf("Rashmi", "jasmine", "Srikutty", "love", "yalini", "MABARO", "avatar1", "avatar2", "avatar3", "avatar4") }
    var currentCycleIndex by remember { mutableStateOf(0) }

    // Pulsing core animation for matching UI
    val infiniteTransition = rememberInfiniteTransition(label = "pulse_waiting")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1.0f,
        targetValue = 1.25f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    // Background Gradient (Beautiful premium Light Theme consistent with DiscoverScreen)
    val backgroundGradient = Brush.verticalGradient(
        colors = listOf(
            Color(0xFFFFD4DC), // Light coral-pink
            Color(0xFFFFEDF1), // Cream rose
            Color(0xFFEAF4FF), // Soft sky blue
            Color(0xFFFFFFFF)
        )
    )

    // 1. Run smooth progress bar and countdown
    LaunchedEffect(Unit) {
        val totalDurationMs = 5000f
        val intervalMs = 50L
        var elapsed = 0L
        while (elapsed < totalDurationMs) {
            delay(intervalMs)
            elapsed += intervalMs
            progress = (elapsed / totalDurationMs).coerceIn(0f, 1f)
            secondsRemaining = ((totalDurationMs - elapsed) / 1000f).coerceAtLeast(0f).toInt() + 1
        }
        progress = 1f
        secondsRemaining = 0

        // Timer is finished! Auto-match with either the queried host or fallback
        val hostToConnect = matchedHost ?: fallbackHosts.random()
        onMatched(
            hostToConnect.uid,
            hostToConnect.alias,
            hostToConnect.ratePerAudioMinute,
            "audio",
            hostToConnect.avatarSeed.ifBlank { hostToConnect.uid }
        )
    }

    // 2. Fetch available online hosts from Firestore
    LaunchedEffect(db) {
        try {
            val snapshot = db.collection("hosts")
                .whereEqualTo("isOnline", true)
                .whereEqualTo("callStatus", "available")
                .limit(15)
                .get()
                .await()
            if (snapshot != null && !snapshot.isEmpty) {
                val parsedHosts = snapshot.documents.mapNotNull { doc ->
                    try {
                        Host.fromMap(doc.data ?: emptyMap())
                    } catch (_: Exception) {
                        null
                    }
                }
                if (parsedHosts.isNotEmpty()) {
                    matchedHost = parsedHosts.random()
                }
            }
        } catch (_: Exception) {
            // Firestore error or permission failure, will naturally fallback
        }
    }

    // 3. Cycle avatars during searching animation
    LaunchedEffect(Unit) {
        while (true) {
            delay(600)
            currentCycleIndex = (currentCycleIndex + 1) % cycleNames.size
        }
    }

    Scaffold(
        containerColor = Color.Transparent,
        modifier = Modifier
            .fillMaxSize()
            .background(backgroundGradient)
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Close / Cancel button at top left
            IconButton(
                onClick = onCancel,
                modifier = Modifier
                    .padding(16.dp)
                    .size(44.dp)
                    .align(Alignment.TopStart)
                    .background(Color.White.copy(alpha = 0.6f), CircleShape)
                    .border(1.dp, Color.White, CircleShape)
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Cancel Match",
                    tint = LightTextPrimary
                )
            }

            // Central Pulsing Avatar & Matching Visuals
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.Center),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier.size(240.dp)
                ) {
                    // Pulsing Outer Glass Ring
                    Box(
                        modifier = Modifier
                            .size(170.dp)
                            .scale(pulseScale)
                            .background(
                                color = SoftPurple.copy(alpha = 0.15f),
                                shape = CircleShape
                            )
                            .border(1.dp, SoftPurple.copy(alpha = 0.25f), CircleShape)
                    )

                    // Secondary Inner Pulsing Ring
                    Box(
                        modifier = Modifier
                            .size(130.dp)
                            .scale(pulseScale * 0.85f)
                            .background(
                                color = RosePink.copy(alpha = 0.1f),
                                shape = CircleShape
                            )
                    )

                    // Core Avatar Container
                    Surface(
                        shape = CircleShape,
                        color = Color.White,
                        tonalElevation = 6.dp,
                        shadowElevation = 8.dp,
                        modifier = Modifier.size(108.dp)
                    ) {
                        val activeSeed = matchedHost?.avatarSeed ?: cycleSeeds[currentCycleIndex]
                        FriendooAvatar(
                            avatarSeed = activeSeed,
                            size = 108.dp,
                            modifier = Modifier.padding(6.dp)
                        )
                    }

                    // Matching Spark Icon Overlay
                    Surface(
                        shape = CircleShape,
                        color = RosePink,
                        modifier = Modifier
                            .size(32.dp)
                            .align(Alignment.BottomEnd)
                            .offset(x = (-60).dp, y = (-60).dp),
                        shadowElevation = 4.dp
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.FlashOn,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Premium Text Indicators
                Text(
                    text = "Quick Match",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = LightTextPrimary,
                    letterSpacing = (-0.5).sp
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Displaying active names cycling
                val currentMatchName = matchedHost?.alias ?: cycleNames[currentCycleIndex]
                Text(
                    text = "Finding host... matching with $currentMatchName",
                    fontSize = 15.sp,
                    color = LightTextSecondary,
                    fontWeight = FontWeight.Medium,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 32.dp)
                )
            }

            // Downside Loading Panel (Bottom Aligned Card)
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .padding(18.dp)
                    .shadow(12.dp, RoundedCornerShape(24.dp)),
                color = Color.White.copy(alpha = 0.9f),
                shape = RoundedCornerShape(24.dp),
                border = borderLight()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Matching in progress",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = LightTextPrimary
                        )

                        Text(
                            text = "$secondsRemaining s",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Black,
                            color = SoftPurple
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Downside Linear Progress Bar
                    LinearProgressIndicator(
                        progress = progress,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp)),
                        color = SoftPurple,
                        trackColor = Color(0xFFF0F0F5)
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "Matching you with premium high-rated available hosts. Connecting in a moment...",
                        fontSize = 12.sp,
                        color = LightTextSecondary,
                        textAlign = TextAlign.Center,
                        lineHeight = 16.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun borderLight(): androidx.compose.foundation.BorderStroke {
    return androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.7f))
}
