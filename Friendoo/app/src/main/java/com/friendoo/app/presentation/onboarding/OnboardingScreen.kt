package com.friendoo.app.presentation.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.friendoo.app.presentation.components.AnonymousAvatar

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

@Composable
fun ConsentScreen(onAccept: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(48.dp))
        
        Icon(
            imageVector = Icons.Default.Shield,
            contentDescription = null,
            modifier = Modifier.size(80.dp),
            tint = MaterialTheme.colorScheme.primary
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Text(
            text = "Your Privacy & Safety",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = "Friendoo is built on total user anonymity, but we maintain high standards for safety and oversight.",
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.secondary
        )
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Surface(
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
            shape = MaterialTheme.shapes.medium,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                ConsentItem(
                    title = "AI Content Moderation",
                    description = "Messages are automatically scanned by an AI system for policy violations before delivery. No human reads your messages unless you submit a report."
                )
                Spacer(modifier = Modifier.height(16.dp))
                ConsentItem(
                    title = "Silent Safety Oversight",
                    description = "We capture behavioral logs (clicks, page views) to identify and block fraud or abuse automatically."
                )
                Spacer(modifier = Modifier.height(16.dp))
                ConsentItem(
                    title = "Anonymous Identity",
                    description = "You will never be asked for your real name, photo, or government ID. You operate under an alias."
                )
                Spacer(modifier = Modifier.height(16.dp))
                ConsentItem(
                    title = "Audio-Only Platform",
                    description = "We do not request camera permissions. All interactions are voice or text based."
                )
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Text(
            text = "By continuing, you agree to our Privacy Policy and consent to behavioral tracking for safety purposes as per DPDPA 2023 regulations.",
            style = MaterialTheme.typography.bodySmall,
            textAlign = TextAlign.Center,
            color = Color.Gray
        )
        
        Spacer(modifier = Modifier.weight(1f))
        
        Button(
            onClick = onAccept,
            modifier = Modifier.fillMaxWidth().height(56.dp),
            shape = MaterialTheme.shapes.large
        ) {
            Text("I Understand & Accept", fontWeight = FontWeight.Bold)
        }
        
        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
fun ConsentItem(title: String, description: String) {
    Column {
        Text(text = title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
        Text(text = description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
fun AliasSelectionScreen(state: OnboardingUiState, viewModel: OnboardingViewModel) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Choose Your Persona",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )
        
        Text(
            text = "This is how others will see you on the platform.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.secondary,
            modifier = Modifier.padding(top = 8.dp, bottom = 32.dp)
        )

        AnonymousAvatar(
            alias = state.alias,
            avatarColorHex = state.avatarColor,
            size = 140.dp,
            fontSize = 48
        )

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "Your Current Alias:",
            style = MaterialTheme.typography.labelLarge
        )
        
        Text(
            text = state.alias,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.ExtraBold,
            color = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(48.dp))

        OutlinedButton(
            onClick = { viewModel.generateNewAlias() },
            modifier = Modifier.fillMaxWidth().height(56.dp),
            shape = MaterialTheme.shapes.large
        ) {
            Text("Regenerate Alias")
        }

        Spacer(modifier = Modifier.height(16.dp))

        Button(
            onClick = { viewModel.completeOnboarding() },
            modifier = Modifier.fillMaxWidth().height(56.dp),
            enabled = !state.isLoading,
            shape = MaterialTheme.shapes.large
        ) {
            if (state.isLoading) {
                CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
            } else {
                Text("Enter the Platform", fontWeight = FontWeight.Bold)
            }
        }
    }
}
