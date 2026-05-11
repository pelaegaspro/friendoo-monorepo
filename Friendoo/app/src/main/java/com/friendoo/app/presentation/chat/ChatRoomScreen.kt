package com.friendoo.app.presentation.chat

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.friendoo.app.data.model.ChatMessage
import com.friendoo.app.presentation.components.AnonymousAvatar
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatRoomScreen(
    viewModel: ChatViewModel,
    otherUserId: String,
    otherUserAlias: String,
    onBack: () -> Unit,
    onNavigateToCall: () -> Unit
) {
    var text by remember { mutableStateOf("") }
    val messages by viewModel.messages.collectAsState()
    val currentUserId by viewModel.currentUserId.collectAsState()

    LaunchedEffect(otherUserId) {
        viewModel.loadMessages(otherUserId)
    }

    var reportingMessage by remember { mutableStateOf<ChatMessage?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        AnonymousAvatar(
                            alias = otherUserAlias,
                            avatarColorHex = "#3700B3",
                            size = 36.dp,
                            fontSize = 14
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(otherUserAlias, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                            Text("Online", fontSize = 11.sp, color = Color.Green)
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = onNavigateToCall) {
                        Icon(Icons.Default.Call, contentDescription = "Call", tint = MaterialTheme.colorScheme.primary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface
                )
            )
        },
        bottomBar = {
            Column(modifier = Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.surface)) {
                // Safety Footer (Permanent deterrent)
                Box(
                    modifier = Modifier.fillMaxWidth().background(Color.Yellow.copy(alpha = 0.05f)).padding(vertical = 4.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        "🔒 Chats are monitored for safety. Contact sharing is not allowed.",
                        fontSize = 10.sp,
                        color = Color.Gray,
                        textAlign = TextAlign.Center
                    )
                }
                
                Surface(
                    tonalElevation = 8.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                            .navigationBarsPadding()
                            .imePadding(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = text,
                            onValueChange = { text = it },
                            modifier = Modifier.weight(1f),
                            placeholder = { Text("Type an anonymous message...") },
                            shape = RoundedCornerShape(24.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color.Transparent,
                                unfocusedBorderColor = Color.Transparent,
                                focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                                unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant
                            ),
                            maxLines = 4
                        )
                        
                        Spacer(modifier = Modifier.width(8.dp))
                        
                        FloatingActionButton(
                            onClick = {
                                if (text.isNotBlank()) {
                                    viewModel.sendMessage(otherUserId, text)
                                    text = ""
                                }
                            },
                            modifier = Modifier.size(48.dp),
                            containerColor = MaterialTheme.colorScheme.primary,
                            contentColor = MaterialTheme.colorScheme.onPrimary,
                            shape = CircleShape,
                            elevation = FloatingActionButtonDefaults.elevation(0.dp)
                        ) {
                            Icon(Icons.Default.Send, contentDescription = "Send", modifier = Modifier.size(20.dp))
                        }
                    }
                }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(MaterialTheme.colorScheme.background),
            contentPadding = PaddingValues(16.dp),
            reverseLayout = false
        ) {
            items(messages) { msg ->
                MessageBubble(
                    msg = msg, 
                    isMine = msg.senderId == currentUserId,
                    onLongClick = { reportingMessage = msg }
                )
            }
        }
    }

    if (reportingMessage != null) {
        com.friendoo.app.presentation.report.ReportBottomSheet(
            reportedUserId = otherUserId,
            reportedAlias = otherUserAlias,
            messageSnippet = reportingMessage?.text,
            onDismiss = { reportingMessage = null }
        )
    }
}

@OptIn(androidx.compose.foundation.ExperimentalFoundationApi::class)
@Composable
fun MessageBubble(msg: ChatMessage, isMine: Boolean, onLongClick: () -> Unit) {
    val isBlocked = false // Stub - blocked field not in ChatMessage
    val alignment = if (isMine) Alignment.CenterEnd else Alignment.CenterStart
    val color = if (isBlocked) {
        Color.Red.copy(alpha = 0.1f)
    } else if (isMine) {
        MaterialTheme.colorScheme.primary
    } else {
        MaterialTheme.colorScheme.secondaryContainer
    }
    
    val contentColor = if (isBlocked) {
        Color.Red
    } else if (isMine) {
        MaterialTheme.colorScheme.onPrimary
    } else {
        MaterialTheme.colorScheme.onSecondaryContainer
    }

    val shape = if (isMine) {
        RoundedCornerShape(16.dp, 16.dp, 2.dp, 16.dp)
    } else {
        RoundedCornerShape(16.dp, 16.dp, 16.dp, 2.dp)
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        contentAlignment = alignment
    ) {
        Column(
            horizontalAlignment = if (isMine) Alignment.End else Alignment.Start,
            modifier = Modifier.combinedClickable(
                onLongClick = onLongClick,
                onClick = {}
            )
        ) {
            Surface(
                color = color,
                contentColor = contentColor,
                shape = shape,
                border = if (isBlocked) BorderStroke(1.dp, Color.Red.copy(alpha = 0.5f)) else null,
                tonalElevation = 2.dp
            ) {
                Text(
                    text = msg.text,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                    fontSize = if (isBlocked) 13.sp else 15.sp,
                    fontWeight = if (isBlocked) FontWeight.Medium else FontWeight.Normal,
                    textAlign = if (isBlocked) TextAlign.Center else TextAlign.Start
                )
            }
            if (!isBlocked) {
                Text(
                    text = formatTime(msg.timestamp),
                    fontSize = 10.sp,
                    color = Color.Gray,
                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                )
            }
        }
    }
}

private fun formatTime(timestamp: String?): String {
    if (timestamp.isNullOrEmpty()) return ""
    return try {
        val sdf = SimpleDateFormat("HH:mm", Locale.getDefault())
        val date = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault()).parse(timestamp)
        sdf.format(date ?: Date())
    } catch (e: Exception) {
        timestamp
    }
}
