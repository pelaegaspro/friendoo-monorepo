package com.friendoo.app.presentation.wallet

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBox
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.friendoo.app.data.remote.api.dto.TransactionDto
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EarningsScreen(
    viewModel: HostWalletViewModel = hiltViewModel(),
    onBack: () -> Unit
) {
    val state by viewModel.uiState
    var showWithdrawDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Earnings", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            // Wallet Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
            ) {
                Column(modifier = Modifier.padding(24.dp)) {
                    Text("Your Balance", style = MaterialTheme.typography.labelLarge)
                    Text(
                        "₹ ${String.format("%.2f", state.earnings?.availableForWithdrawal ?: 0.0)}",
                        style = MaterialTheme.typography.headlineLarge,
                        fontWeight = FontWeight.Black,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Button(
                            onClick = { showWithdrawDialog = true },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Default.AccountBox, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("Withdraw")
                        }
                    }
                }
            }

            Spacer(Modifier.height(32.dp))

            Text("Withdrawal History", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(16.dp))

            if (state.history.isEmpty()) {
                Text("No withdrawal history", color = Color.Gray, fontSize = 14.sp)
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(state.history) { req ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(
                                    "₹${req.amount}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    req.status,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = when (req.status) {
                                        "completed" -> Color.Green
                                        "rejected", "failed" -> Color.Red
                                        else -> Color.Gray
                                    }
                                )
                            }
                            Text(
                                req.requestedAt?.let {
                                    SimpleDateFormat("MMM dd", Locale.getDefault()).format(it)
                                } ?: "",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.Gray
                            )
                        }
                    }
                }
            }
        }
    }

    if (showWithdrawDialog) {
        WithdrawDialog(
            isUpiVerified = false,
            balance = state.earnings?.availableForWithdrawal ?: 0.0,
            onDismiss = { showWithdrawDialog = false },
            onConfirm = { amount, upi ->
                viewModel.requestWithdrawal(amount, upi ?: "")
                showWithdrawDialog = false
            }
        )
    }
}

@Composable
fun TransactionItem(tx: TransactionDto) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(
                        if (tx.type == "credit") Color.Green.copy(alpha = 0.1f) else Color.Red.copy(alpha = 0.1f),
                        RoundedCornerShape(12.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (tx.type == "credit") Icons.Default.Add else Icons.Default.KeyboardArrowRight,
                    contentDescription = null,
                    tint = if (tx.type == "credit") Color.Green else Color.Red,
                    modifier = Modifier.size(20.dp)
                )
            }
            Spacer(Modifier.width(16.dp))
            Column {
                Text(
                    if (tx.type == "credit") "Call Earning" else "Withdrawal",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    "Transaction",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray
                )
            }
        }
        Text(
            "${if (tx.type == "credit") "+" else "-"} ₹${tx.amount}",
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.Bold,
            color = if (tx.type == "credit") Color.Green else Color.White
        )
    }
}

@Composable
fun WithdrawDialog(
    isUpiVerified: Boolean,
    balance: Double,
    onDismiss: () -> Unit,
    onConfirm: (Double, String?) -> Unit
) {
    var upiId by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Withdraw Funds") },
        text = {
            Column(modifier = Modifier.padding(top = 8.dp)) {
                if (!isUpiVerified) {
                    OutlinedTextField(
                        value = upiId,
                        onValueChange = { upiId = it },
                        label = { Text("Enter UPI ID") },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("example@upi") }
                    )
                    Text(
                        "We will send ₹1 to verify your account.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray,
                        modifier = Modifier.padding(top = 4.dp, bottom = 16.dp)
                    )
                } else {
                    Text(
                        "Payout to: UPI Verified ✓",
                        color = Color.Green,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(bottom = 16.dp)
                    )
                }

                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it },
                    label = { Text("Amount (₹)") },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Min. ₹200") }
                )
                Text(
                    "Balance: ₹${String.format("%.2f", balance)}",
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(top = 4.dp)
                )

                Spacer(Modifier.height(16.dp))
                Text(
                    "Payouts are processed within 24 hours.",
                    style = MaterialTheme.typography.bodySmall,
                    fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val amt = amount.toDoubleOrNull()
                    if (amt != null) onConfirm(amt, if (isUpiVerified) null else upiId)
                }
            ) {
                Text("Confirm Withdrawal")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
