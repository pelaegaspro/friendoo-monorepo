package com.friendoo.app.presentation.report

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.friendoo.app.R
import com.friendoo.app.data.model.Report
import com.friendoo.app.data.model.ReportMessage
import com.friendoo.app.data.model.toFormattedTime

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportThreadScreen(
    reportId: String,
    onBack: () -> Unit,
    viewModel: ReportThreadViewModel = hiltViewModel()
) {
    val messages by viewModel.messages.collectAsState()
    val report by viewModel.report.collectAsState()
    val listState = rememberLazyListState()

    LaunchedEffect(reportId) {
        viewModel.loadThread(reportId)
        viewModel.markMessagesAsRead(reportId)
    }

    // Auto-scroll to latest message
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            report?.reason?.replace("_", " ")?.replaceFirstChar { it.uppercase() } ?: "Report",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Text(
                            "Report #${report?.id?.take(8)}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
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
        ) {
            // Status banner at top
            report?.let { ReportStatusBanner(status = it.status) }

            // Message list
            LazyColumn(
                state = listState,
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(messages) { message ->
                    ReportMessageBubble(message = message)
                }
            }
        }
    }
}

@Composable
fun ReportStatusBanner(status: String) {
    val (bgColor, icon, label) = when (status) {
        "pending"      -> Triple(Color(0xFFFFF3E0), "⏳", "Pending Review")
        "under_review" -> Triple(Color(0xFFE3F2FD), "🔍", "Under Review")
        "resolved"     -> Triple(Color(0xFFE8F5E9), "✅", "Resolved")
        "rejected"     -> Triple(Color(0xFFFFEBEE), "❌", "Report Closed")
        else           -> Triple(Color(0xFFF5F5F5), "📋", status)
    }
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(bgColor)
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(icon)
        Text(label, style = MaterialTheme.typography.labelMedium)
    }
}

@Composable
fun ReportMessageBubble(message: ReportMessage) {
    val isUser = message.senderType == "user"

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
    ) {
        if (!isUser) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primary),
                contentAlignment = Alignment.Center
            ) {
                Text("F", color = Color.White, style = MaterialTheme.typography.labelMedium)
            }
            Spacer(modifier = Modifier.width(8.dp))
        }

        Column(horizontalAlignment = if (isUser) Alignment.End else Alignment.Start) {
            Surface(
                shape = RoundedCornerShape(
                    topStart = 16.dp,
                    topEnd = 16.dp,
                    bottomStart = if (isUser) 16.dp else 4.dp,
                    bottomEnd = if (isUser) 4.dp else 16.dp
                ),
                color = if (isUser) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                modifier = Modifier.widthIn(max = 280.dp)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    if (!isUser) {
                        Text(
                            "Friendoo Support",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                    }
                    Text(
                        text = message.text,
                        color = if (isUser) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }

            Spacer(modifier = Modifier.height(2.dp))
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = message.createdAt.toFormattedTime(),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (isUser) {
                    TickMark(message = message)
                }
            }
        }
    }
}

@Composable
fun TickMark(message: ReportMessage) {
    val isRead = message.readAt != null
    val isDelivered = message.deliveredAt != null
    
    val tint = when {
        isRead -> Color(0xFF4FC3F7)
        else -> Color(0xFF9E9E9E)
    }
    
    Icon(
        imageVector = Icons.Default.Check,
        contentDescription = null,
        modifier = Modifier.size(16.dp),
        tint = tint
    )
}
