package com.friendoo.app.presentation.wallet

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Payment
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.friendoo.app.data.remote.api.dto.TransactionDto
import com.friendoo.app.presentation.theme.DarkCard
import com.friendoo.app.presentation.theme.LightCard
import java.text.SimpleDateFormat
import java.util.*

@Composable
private fun isSystemInDarkTheme(): Boolean = false

private val ConnectoBlue = Color(0xFF4A7DF0)
private val ConnectoGreen = Color(0xFF27C044)
private val ConnectoRed = Color(0xFFFF4054)
private val ConnectoText = Color(0xFF111111)
private val ConnectoMuted = Color(0xFF777777)
private val ConnectoBgTop = Color(0xFFFFD6DA)
private val ConnectoBgBottom = Color(0xFFE4ECFF)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UserTransactionsScreen(
    viewModel: WalletViewModel,
    onBack: () -> Unit
) {
    val uiState by viewModel.state.collectAsState()
    val isDark = isSystemInDarkTheme()
    
    val bgGradient = if (isDark) {
        Brush.verticalGradient(listOf(Color(0xFF0E0F11), Color(0xFF18191C)))
    } else {
        Brush.verticalGradient(listOf(ConnectoBgTop, ConnectoBgBottom))
    }
    
    val textColor = if (isDark) Color.White else Color.Black
    val surfaceColor = if (isDark) DarkCard else Color.White
    val mutedTextColor = if (isDark) Color(0xFFA7A7A7) else ConnectoMuted

    Scaffold(
        containerColor = Color.Transparent,
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        "Transaction History", 
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 20.sp,
                        color = textColor
                    ) 
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            Icons.Default.ArrowBack, 
                            contentDescription = "Back",
                            tint = textColor
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.Transparent
                )
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(bgGradient)
                .padding(padding)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Balance Summary Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(containerColor = surfaceColor),
                    elevation = CardDefaults.cardElevation(0.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            "Current Balance",
                            color = mutedTextColor,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium
                        )
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                "${uiState.balance} Coins",
                                color = ConnectoBlue,
                                fontWeight = FontWeight.Black,
                                fontSize = 28.sp
                            )
                            Surface(
                                shape = RoundedCornerShape(50),
                                color = ConnectoBlue.copy(alpha = 0.12f),
                                border = androidx.compose.foundation.BorderStroke(1.dp, ConnectoBlue)
                            ) {
                                Text(
                                    text = "Active Account",
                                    color = ConnectoBlue,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                               )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = "Recent Transactions",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 16.sp,
                    color = textColor
                )

                if (uiState.isLoading) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(color = ConnectoBlue)
                    }
                } else if (uiState.transactions.isEmpty()) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f)
                            .padding(bottom = 50.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(80.dp)
                                .background(ConnectoBlue.copy(alpha = 0.08f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.History,
                                contentDescription = null,
                                tint = ConnectoBlue,
                                modifier = Modifier.size(40.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            "No transactions yet",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = textColor
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            "Recharge now or make a call to see transaction logs.",
                            color = mutedTextColor,
                            fontSize = 13.sp,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(horizontal = 24.dp)
                        )
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        contentPadding = PaddingValues(bottom = 24.dp)
                    ) {
                        items(uiState.transactions) { tx ->
                            UserTransactionRow(
                                tx = tx,
                                isDark = isDark,
                                textColor = textColor,
                                surfaceColor = surfaceColor,
                                mutedTextColor = mutedTextColor
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun UserTransactionRow(
    tx: TransactionDto,
    isDark: Boolean,
    textColor: Color,
    surfaceColor: Color,
    mutedTextColor: Color
) {
    val isCredit = tx.type == "credit" || tx.type == "topup"
    val iconBgColor = if (isCredit) ConnectoGreen.copy(alpha = 0.12f) else ConnectoRed.copy(alpha = 0.12f)
    val iconColor = if (isCredit) ConnectoGreen else ConnectoRed
    val icon = if (isCredit) Icons.Default.Add else Icons.Default.Remove
    
    val formattedDate = remember(tx.createdAt) {
        try {
            val parser = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US)
            val date = parser.parse(tx.createdAt)
            if (date != null) {
                SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault()).format(date)
            } else {
                tx.createdAt
            }
        } catch (e: Exception) {
            tx.createdAt
        }
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = surfaceColor),
        elevation = CardDefaults.cardElevation(0.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Icon Badge
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .background(iconBgColor, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = iconColor,
                    modifier = Modifier.size(20.dp)
                )
            }
            
            Spacer(modifier = Modifier.width(12.dp))
            
            // Description & Meta
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                Text(
                    text = tx.description,
                    color = textColor,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
                Text(
                    text = formattedDate,
                    color = mutedTextColor,
                    fontSize = 11.sp
                )
                if (tx.referenceId.isNotEmpty()) {
                    Text(
                        text = "Ref: ${tx.referenceId}",
                        color = mutedTextColor.copy(alpha = 0.7f),
                        fontSize = 9.5.sp,
                        fontWeight = FontWeight.Light
                    )
                }
            }
            
            Spacer(modifier = Modifier.width(8.dp))
            
            // Amount & Balance After
            Column(
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                Text(
                    text = "${if (isCredit) "+" else "-"} ${tx.amount} Coins",
                    color = iconColor,
                    fontWeight = FontWeight.Black,
                    fontSize = 14.sp
                )
                Text(
                    text = "Bal: ${tx.balanceAfter}",
                    color = mutedTextColor,
                    fontSize = 10.5.sp
                )
            }
        }
    }
}
