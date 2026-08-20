package com.friendoo.app.presentation.call

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.friendoo.app.presentation.call.components.SoftSignalBottomSheet

@Composable
fun CallEndScreen(
    hostAlias: String,
    hostId: String,
    sessionId: String,
    onFinish: () -> Unit,
    viewModel: SoftSignalViewModel = hiltViewModel()
) {
    var showSoftSignalSheet by remember { mutableStateOf(false) }
    var signalSubmitted by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("Call Ended", style = MaterialTheme.typography.headlineMedium)
        Text("with $hostAlias", color = MaterialTheme.colorScheme.onSurfaceVariant)
        
        Spacer(modifier = Modifier.height(48.dp))
        
        // Placeholder for Rating Section
        Text("How was your conversation?", fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
        Row(modifier = Modifier.padding(vertical = 16.dp)) {
            repeat(5) {
                Icon(
                    imageVector = Icons.Default.Star,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.outline,
                    modifier = Modifier.size(40.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Only show if not yet submitted in this session
        if (!signalSubmitted) {
            TextButton(
                onClick = { showSoftSignalSheet = true },
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    "Something felt off about this call",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        } else {
            Text(
                "✅ Signal submitted — thank you",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.fillMaxWidth(),
                textAlign = TextAlign.Center
            )
        }

        Spacer(modifier = Modifier.height(64.dp))

        Button(
            onClick = onFinish,
            modifier = Modifier.fillMaxWidth().height(56.dp)
        ) {
            Text("Go Home")
        }
    }

    if (showSoftSignalSheet) {
        SoftSignalBottomSheet(
            hostAlias = hostAlias,
            onSubmit = { freeText ->
                viewModel.submitSoftSignal(hostId, sessionId, freeText)
                signalSubmitted = true
                showSoftSignalSheet = false
            },
            onDismiss = { showSoftSignalSheet = false }
        )
    }
}
