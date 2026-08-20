package com.friendoo.app.presentation.report

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportBottomSheet(
    reportedUserId: String,
    reportedAlias: String,
    messageSnippet: String? = null,
    sessionId: String? = null,
    onDismiss: () -> Unit,
    viewModel: ReportViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    var selectedReason by remember { mutableStateOf<String?>(null) }
    var fraudDescription by remember { mutableStateOf("") }
    var amountLost by remember { mutableStateOf("") }
    var selectedImageUri by remember { mutableStateOf<Uri?>(null) }

    val photoLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri -> selectedImageUri = uri }

    val reasons = listOf(
        "Harassment / Bullying",
        "Threats of Violence",
        "Off-Platform Fraud",
        "Inappropriate Content",
        "PII Sharing (Phone/Email)",
        "Spam"
    )

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 32.dp, start = 24.dp, end = 24.dp)
        ) {
            if (state.isSuccess) {
                SuccessView(onDismiss)
            } else if (selectedReason == "Off-Platform Fraud") {
                FraudEvidenceFlow(
                    onBack = { selectedReason = null },
                    description = fraudDescription,
                    onDescriptionChange = { fraudDescription = it },
                    amount = amountLost,
                    onAmountChange = { amountLost = it },
                    imageUri = selectedImageUri,
                    onPickImage = { photoLauncher.launch("image/*") },
                    onSubmit = {
                        viewModel.submitReport(
                            reportedUserId = reportedUserId,
                            reportedAlias = reportedAlias,
                            reason = "Off-Platform Fraud",
                            description = fraudDescription,
                            amountLost = amountLost.toDoubleOrNull() ?: 0.0,
                            evidenceUri = selectedImageUri,
                            sessionId = sessionId
                        )
                    },
                    isSubmitting = state.isSubmitting
                )
            } else {
                Text(
                    text = "Report Anonymous User",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Why are you reporting $reportedAlias?",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.Gray,
                    modifier = Modifier.padding(top = 4.dp, bottom = 24.dp)
                )

                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(reasons) { reason ->
                        ListItem(
                            headlineContent = { Text(reason) },
                            trailingContent = { Icon(Icons.Default.KeyboardArrowRight, contentDescription = null) },
                            modifier = Modifier.clickable {
                                if (reason == "Off-Platform Fraud") {
                                    selectedReason = reason
                                } else {
                                    viewModel.submitReport(
                                        reportedUserId = reportedUserId,
                                        reportedAlias = reportedAlias,
                                        reason = reason,
                                        messageSnippet = messageSnippet,
                                        sessionId = sessionId
                                    )
                                }
                            },
                            colors = ListItemDefaults.colors(containerColor = Color.Transparent)
                        )
                        Divider(color = Color.DarkGray.copy(alpha = 0.3f))
                    }
                }

                if (state.isSubmitting) {
                    LinearProgressIndicator(modifier = Modifier.fillMaxWidth().padding(top = 16.dp))
                }
            }
        }
    }
}

@Composable
fun FraudEvidenceFlow(
    onBack: () -> Unit,
    description: String,
    onDescriptionChange: (String) -> Unit,
    amount: String,
    onAmountChange: (String) -> Unit,
    imageUri: Uri?,
    onPickImage: () -> Unit,
    onSubmit: () -> Unit,
    isSubmitting: Boolean
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, contentDescription = null) }
            Text("Evidence: Off-Platform Fraud", fontWeight = FontWeight.Bold, fontSize = 18.sp)
        }

        Spacer(Modifier.height(16.dp))
        
        OutlinedTextField(
            value = description,
            onValueChange = onDescriptionChange,
            label = { Text("What happened?") },
            placeholder = { Text("Host asked me to pay outside app...") },
            modifier = Modifier.fillMaxWidth(),
            minLines = 3
        )

        Spacer(Modifier.height(16.dp))

        OutlinedTextField(
            value = amount,
            onValueChange = onAmountChange,
            label = { Text("Amount lost (₹)") },
            modifier = Modifier.fillMaxWidth(),
            keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                keyboardType = androidx.compose.ui.text.input.KeyboardType.Number
            )
        )

        Spacer(Modifier.height(24.dp))

        Text("Upload proof (Screenshot of payment/chat)", style = MaterialTheme.typography.labelMedium)
        
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp)
                .height(120.dp)
                .background(Color.DarkGray.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                .clickable { onPickImage() },
            contentAlignment = Alignment.Center
        ) {
            if (imageUri != null) {
                AsyncImage(
                    model = imageUri,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize().clip(RoundedCornerShape(12.dp)),
                    contentScale = ContentScale.Crop
                )
            } else {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Add, contentDescription = null)
                    Text("Attach Screenshot", fontSize = 12.sp)
                }
            }
        }

        Spacer(Modifier.height(32.dp))

        Button(
            onClick = onSubmit,
            modifier = Modifier.fillMaxWidth().height(56.dp),
            enabled = !isSubmitting && description.isNotBlank() && amount.isNotBlank(),
            shape = RoundedCornerShape(12.dp)
        ) {
            if (isSubmitting) CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
            else Text("Submit Report", fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun SuccessView(onDismiss: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxWidth().padding(vertical = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color.Green, modifier = Modifier.size(64.dp))
        Spacer(Modifier.height(16.dp))
        Text("Report Received", fontWeight = FontWeight.Black, fontSize = 22.sp)
        Text(
            "We have received your report and screenshot. We will review and verify the host's UPI details within 48 hours.",
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            color = Color.Gray,
            modifier = Modifier.padding(horizontal = 16.dp).padding(top = 8.dp)
        )
        Spacer(Modifier.height(32.dp))
        Button(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
            Text("Done")
        }
    }
}
