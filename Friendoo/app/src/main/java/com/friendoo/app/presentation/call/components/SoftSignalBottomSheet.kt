package com.friendoo.app.presentation.call.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun SoftSignalBottomSheet(
    hostAlias: String,
    onSubmit: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var freeText by remember { mutableStateOf("") }
    var submitted by remember { mutableStateOf(false) }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            if (!submitted) {
                Text(
                    text = "What felt off?",
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = "This is anonymous. No proof needed. Just tell us what felt wrong.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                // Quick-tap chips — most common signals
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(
                        "Asked to move to WhatsApp",
                        "Asked for money",
                        "Felt fake/scripted",
                        "Inappropriate behaviour",
                        "Asked for personal info"
                    ).forEach { label ->
                        FilterChip(
                            selected = freeText == label,
                            onClick = { freeText = label },
                            label = { Text(label, style = MaterialTheme.typography.labelSmall) }
                        )
                    }
                }

                OutlinedTextField(
                    value = freeText,
                    onValueChange = { freeText = it },
                    placeholder = { Text("Or describe in your own words (optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cancel")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            submitted = true
                            onSubmit(freeText)
                        }
                    ) {
                        Text("Submit Anonymously")
                    }
                }

            } else {
                // Thank you state
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text("✅", style = MaterialTheme.typography.displaySmall)
                    Text(
                        "Thanks for letting us know.",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Text(
                        "We review these signals every week to keep the platform safe.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    TextButton(onClick = onDismiss) { Text("Close") }
                }
            }
        }
    }
}
