package com.friendoo.app.presentation.onboarding

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.friendoo.app.presentation.components.FriendooAvatar
import com.friendoo.app.presentation.components.FriendooButton
import com.friendoo.app.presentation.components.FriendooCard
import com.friendoo.app.presentation.theme.*

@Composable
fun OnboardingScreen(
    viewModel: OnboardingViewModel = hiltViewModel(),
    onComplete: () -> Unit
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(state.isComplete) {
        if (state.isComplete) {
            onComplete()
        }
    }

    if (state.showConsentScreen) {
        ConsentScreen(onAccept = { viewModel.onAcceptConsent() })
    } else {
        AliasSelectionScreen(state = state, viewModel = viewModel)
    }
}

// === PROGRESS DOTS ===
@Composable
fun OnboardingProgress(currentStep: Int, totalSteps: Int = 2) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.padding(vertical = 16.dp)
    ) {
        repeat(totalSteps) { index ->
            val isActive = index < currentStep
            val isCurrent = index == currentStep - 1
            Box(
                modifier = Modifier
                    .width(if (isCurrent) 24.dp else 8.dp)
                    .height(8.dp)
                    .clip(PillShape)
                    .background(if (isActive || isCurrent) Coral else BorderLight)
            )
        }
    }
}

// === CONSENT SCREEN ===
@Composable
fun ConsentScreen(onAccept: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(WarmWhite)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            OnboardingProgress(currentStep = 1)

            // Illustration placeholder
            Box(
                modifier = Modifier
                    .size(140.dp)
                    .clip(CircleShape)
                    .background(Teal.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Lock,
                    contentDescription = null,
                    modifier = Modifier.size(56.dp),
                    tint = Teal
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Your safety comes first",
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Before you connect, here's how we keep you safe.",
                style = MaterialTheme.typography.bodyLarge,
                color = WarmGray,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(32.dp))

            // 4 consent cards
            ConsentCard(
                icon = Icons.Default.Lock,
                iconColor = Teal,
                title = "AI monitors for safety",
                description = "Messages are scanned for policy violations automatically."
            )
            Spacer(modifier = Modifier.height(12.dp))
            ConsentCard(
                icon = Icons.Default.Info,
                iconColor = Coral,
                title = "100% Anonymous",
                description = "No real name, photo, or ID required. Ever."
            )
            Spacer(modifier = Modifier.height(12.dp))
            ConsentCard(
                icon = Icons.Default.Phone,
                iconColor = InfoBlue,
                title = "Audio only, no cameras",
                description = "We never request camera permissions."
            )
            Spacer(modifier = Modifier.height(12.dp))
            ConsentCard(
                icon = Icons.Default.Info,
                iconColor = WarningAmber,
                title = "We log behavior, not content",
                description = "Clicks and page views help us detect abuse."
            )

            Spacer(modifier = Modifier.height(32.dp))

            FriendooButton(
                text = "I Understand",
                onClick = onAccept
            )

            Spacer(modifier = Modifier.height(12.dp))

            TextButton(onClick = { /* Open bottom sheet or browser */ }) {
                Text("Learn more", color = Coral, fontWeight = FontWeight.SemiBold)
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@Composable
fun ConsentCard(icon: ImageVector, iconColor: Color, title: String, description: String) {
    FriendooCard {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(iconColor.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(24.dp))
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = WarmGray
                )
            }
        }
    }
}

// === ALIAS SELECTION SCREEN ===
val avatarColors = listOf(
    "#FF6B6B", "#4ECDC4", "#FFE66D", "#A78BFA",
    "#F472B6", "#60A5FA", "#34D399", "#FB923C"
)

@Composable
fun AliasSelectionScreen(state: OnboardingUiState, viewModel: OnboardingViewModel) {
    var selectedColor by remember { mutableStateOf(state.avatarColor) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(WarmWhite)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            OnboardingProgress(currentStep = 2)

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "This is your voice identity",
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Your alias keeps you anonymous on every call.",
                style = MaterialTheme.typography.bodyLarge,
                color = WarmGray,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(40.dp))

            // Large animated avatar
            FriendooAvatar(
                alias = state.alias,
                colorHex = selectedColor,
                size = 140.dp,
                fontSize = 48,
                showGlow = true
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Alias with shuffle
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = state.alias,
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = Coral
                )
                IconButton(
                    onClick = { viewModel.generateNewAlias() },
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(SurfaceElevated)
                        .border(1.dp, BorderLight, CircleShape)
                ) {
                    Icon(
                        Icons.Default.Refresh,
                        contentDescription = "Shuffle alias",
                        tint = Coral,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Tap the dice to get a new alias",
                style = MaterialTheme.typography.bodySmall,
                color = LightGray
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Color picker
            Text(
                text = "Choose your color",
                style = MaterialTheme.typography.labelLarge,
                color = WarmGray,
                modifier = Modifier.align(Alignment.Start)
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                avatarColors.take(6).forEach { colorHex ->
                    val isSelected = selectedColor == colorHex
                    val color = try { Color(android.graphics.Color.parseColor(colorHex)) } catch (_: Exception) { Coral }
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(color)
                            .border(
                                width = if (isSelected) 3.dp else 0.dp,
                                color = if (isSelected) DeepNavy else Color.Transparent,
                                shape = CircleShape
                            )
                            .clickable { selectedColor = colorHex },
                        contentAlignment = Alignment.Center
                    ) {
                        if (isSelected) {
                            Icon(
                                Icons.Default.Check,
                                contentDescription = null,
                                tint = PureWhite,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(48.dp))

            Text(
                text = "Your alias keeps you anonymous. You can change it anytime.",
                style = MaterialTheme.typography.bodySmall,
                color = LightGray,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(16.dp))

            FriendooButton(
                text = "Get Started",
                onClick = { viewModel.completeOnboarding() }
            )

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}
