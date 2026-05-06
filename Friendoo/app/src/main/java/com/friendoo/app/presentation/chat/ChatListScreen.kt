package com.friendoo.app.presentation.chat

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.friendoo.app.presentation.components.EmptyView

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatListScreen(
    onChatClick: (String, String) -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Chats") })
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding).fillMaxSize()) {
            EmptyView(message = "No recent chats")
            // TODO: Implement actual chat list
        }
    }
}
