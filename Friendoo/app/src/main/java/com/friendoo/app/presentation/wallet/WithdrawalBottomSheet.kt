package com.friendoo.app.presentation.wallet

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.friendoo.app.data.model.WithdrawalRequest
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WithdrawalBottomSheet(
    viewModel: HostWalletViewModel,
    onDismiss: () -> Unit
) {
    val uiState by viewModel.uiState
    var amount by remember { mutableStateOf("") }
    var upiId by remember { mutableStateOf("") }

    val sheetState = rememberModalBottomSheetState()

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = MaterialTheme.colorScheme.surface,
        dragHandle = { BottomSheetDefaults.DragHandle() }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(bottom = 40.dp)
        ) {
            Text(
                "Request Payout",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Surface(
                color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f),
                shape = MaterialTheme.shapes.medium
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Info, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        "Available for withdrawal: ₹${uiState.earnings?.availableForWithdrawal ?: 0.0}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            OutlinedTextField(
                value = amount,
                onValueChange = { if (it.all { char -> char.isDigit() }) amount = it },
                label = { Text("Amount (INR)") },
                placeholder = { Text("Min ₹100") },
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                prefix = { Text("₹") },
                singleLine = true
            )

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = upiId,
                onValueChange = { upiId = it },
                label = { Text("UPI ID") },
                placeholder = { Text("example@upi") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            if (uiState.error != null) {
                Text(
                    uiState.error!!,
                    color = MaterialTheme.colorScheme.error,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            if (uiState.successMessage != null) {
                Text(
                    uiState.successMessage!!,
                    color = Color.Green,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = { 
                    viewModel.requestWithdrawal(amount.toDoubleOrNull() ?: 0.0, upiId)
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = !uiState.isSubmitting && amount.isNotEmpty() && upiId.isNotEmpty(),
                shape = MaterialTheme.shapes.large
            ) {
                if (uiState.isSubmitting) {
                    CircularProgressIndicator(size = 20.dp, color = Color.White)
                } else {
                    Text("Submit Request")
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.History, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Recent Withdrawals", fontWeight = FontWeight.SemiBold)
            }

            Spacer(modifier = Modifier.height(12.dp))

            LazyColumn(modifier = Modifier.heightIn(max = 200.dp)) {
                items(uiState.history) { request ->
                    WithdrawalHistoryItem(request)
                }
                if (uiState.history.isEmpty()) {
                    item {
                        Text("No payout history yet.", fontSize = 13.sp, color = Color.Gray)
                    }
                }
            }
        }
    }
}

@Composable
fun WithdrawalHistoryItem(request: WithdrawalRequest) {
    val statusColor = when (request.status) {
        "completed" -> Color.Green
        "pending" -> Color.Yellow
        "approved" -> Color.Cyan
        "rejected", "failed" -> Color.Red
        else -> Color.Gray
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text("₹${request.amount}", fontWeight = FontWeight.Bold)
            Text(
                formatDate(request.requestedAt),
                fontSize = 11.sp,
                color = Color.Gray
            )
        }
        Surface(
            color = statusColor.copy(alpha = 0.1f),
            shape = MaterialTheme.shapes.small
        ) {
            Text(
                request.status.uppercase(),
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = statusColor
            )
        }
    }
}

private fun formatDate(timestamp: com.google.firebase.Timestamp?): String {
    if (timestamp == null) return ""
    val sdf = SimpleDateFormat("dd MMM, hh:mm a", Locale.getDefault())
    return sdf.format(timestamp.toDate())
}
