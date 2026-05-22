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

@Composable
fun IncomingRequestDialog(
    callId: String,
    callerAlias: String,
    ratePerMinute: Int,
    callTypeLabel: String,
    secondsLeft: Int,
    isSubmitting: Boolean,
    onAccept: () -> Unit,
    onDecline: () -> Unit
) {

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
                    color = Color.Green.copy(alpha = 0.1f),
                    modifier = Modifier.size(80.dp)
                ) {
                    Icon(
                        Icons.Default.Call,
                        contentDescription = null,
                        tint = Color.Green,
                        modifier = Modifier.padding(20.dp).size(40.dp)
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    "📞 Incoming $callTypeLabel call",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Black,
                    textAlign = TextAlign.Center
                )

                Text(
                    "$callerAlias · $ratePerMinute coins/min",
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
                    "$secondsLeft seconds left",
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
                onClick = onAccept,
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
