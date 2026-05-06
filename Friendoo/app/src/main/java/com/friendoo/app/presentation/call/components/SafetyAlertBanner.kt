package com.friendoo.app.presentation.call.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Composable
fun SafetyAlertBanner(
    message: String,
    severity: String,
    onDismiss: () -> Unit
) {
    val bgColor = when (severity) {
        "CRITICAL" -> Color(0xFFB91C1C)  // red
        "HIGH"     -> Color(0xFFF59E0B)  // amber
        else       -> Color(0xFF7C3AED)  // purple
    }

    Surface(
        color = bgColor,
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                text = message,
                color = Color.White,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.weight(1f)
            )
            IconButton(onClick = onDismiss) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Dismiss",
                    tint = Color.White
                )
            }
        }
    }
}

@androidx.compose.ui.tooling.preview.Preview
@Composable
fun SafetyAlertBannerPreview() {
    SafetyAlertBanner(
        message = "⚠️ Off-platform payments are not allowed. All payments must go through Friendoo wallet.",
        severity = "HIGH",
        onDismiss = {}
    )
}
