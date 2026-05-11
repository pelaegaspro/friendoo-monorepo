package com.friendoo.app.presentation.call

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

@Composable
fun IncomingRequestDialog(
    requestId: String,
    isPriority: Boolean,
    expiresAtIso: String,
    onAccept: (String) -> Unit, // callId
    onDecline: () -> Unit
) {
    var timeLeft by remember { mutableStateOf(30) }
    var isSubmitting by remember { mutableStateOf(false) }

    LaunchedEffect(requestId) {
        // Simple countdown logic
        while (timeLeft > 0) {
            delay(1000)
            timeLeft--
        }
        onDecline()
    }

    AlertDialog(
        onDismissRequest = { /* Force action */ },
        modifier = Modifier.fillMaxWidth().padding(16.dp),
        properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false),
        title = null,
        text = {
            Column(
                modifier = Modifier.fillMaxWidth().padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Surface(
                    shape = CircleShape,
                    color = if (isPriority) Color(0xFFFFD700).copy(alpha = 0.1f) else Color.Green.copy(alpha = 0.1f),
                    modifier = Modifier.size(80.dp)
                ) {
                    Icon(
                        Icons.Default.Call,
                        contentDescription = null,
                        tint = if (isPriority) Color(0xFFFFD700) else Color.Green,
                        modifier = Modifier.padding(20.dp).size(40.dp)
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    if (isPriority) "⭐ Priority Request!" else "📞 Someone wants to talk!",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Black,
                    textAlign = TextAlign.Center
                )

                Text(
                    "Anonymous User · ₹3/min earnings",
                    style = MaterialTheme.typography.bodyLarge,
                    color = Color.Gray,
                    modifier = Modifier.padding(top = 8.dp)
                )

                Spacer(modifier = Modifier.height(32.dp))

                Text(
                    "Accept before it's gone!",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.primary
                )

                Text(
                    "$timeLeft seconds left",
                    style = MaterialTheme.typography.displaySmall,
                    fontWeight = FontWeight.Light,
                    fontSize = 48.sp
                )

                if (isSubmitting) {
                    LinearProgressIndicator(modifier = Modifier.fillMaxWidth().padding(top = 16.dp))
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    isSubmitting = true
                    // Stub - simulate success
                    onAccept("call_${System.currentTimeMillis()}")
                },
                modifier = Modifier.fillMaxWidth().height(64.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color.Green, contentColor = Color.White),
                enabled = !isSubmitting
            ) {
                Text("✅ ACCEPT", fontWeight = FontWeight.Black, fontSize = 18.sp)
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDecline,
                modifier = Modifier.fillMaxWidth(),
                enabled = !isSubmitting
            ) {
                Text("Decline Request", color = Color.Gray)
            }
        },
        shape = RoundedCornerShape(28.dp),
        containerColor = MaterialTheme.colorScheme.surface
    )
}
