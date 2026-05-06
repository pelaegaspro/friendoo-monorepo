package com.friendoo.app.presentation.profile

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.friendoo.app.presentation.components.AnonymousAvatar
import com.friendoo.app.presentation.components.ErrorView
import com.friendoo.app.presentation.components.LoadingIndicator

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    viewModel: ProfileViewModel,
    onLogoutSuccess: () -> Unit
) {
    val state by viewModel.state.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Profile") })
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding).fillMaxSize()) {
            when (val currentState = state) {
                is ProfileState.Loading -> LoadingIndicator()
                is ProfileState.Error -> ErrorView(message = currentState.message, onRetry = { viewModel.loadProfile() })
                is ProfileState.Success -> {
                    val user = currentState.user
                    Column(
                        modifier = Modifier.fillMaxSize().padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        AnonymousAvatar(
                            alias = user.alias,
                            avatarColorHex = user.avatarColor,
                            modifier = Modifier.size(100.dp),
                            fontSize = 32
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(text = user.alias, style = MaterialTheme.typography.headlineMedium)
                        // Masked phone number for anonymity
                        val maskedPhone = if (user.phoneNumber.length >= 4) {
                            user.phoneNumber.take(3) + "****" + user.phoneNumber.takeLast(4)
                        } else {
                            user.phoneNumber
                        }
                        Text(text = maskedPhone, style = MaterialTheme.typography.bodyLarge)
                        Spacer(modifier = Modifier.height(24.dp))
                        
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("Coins: ${user.coins}", style = MaterialTheme.typography.titleMedium)
                                Text("City: ${user.city}", style = MaterialTheme.typography.bodyMedium)
                                Text("Bio: ${user.bio}", style = MaterialTheme.typography.bodyMedium)
                            }
                        }
                        
                        Spacer(modifier = Modifier.weight(1f))
                        Button(
                            onClick = { 
                                viewModel.logout()
                                onLogoutSuccess()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Logout")
                        }
                    }
                }
            }
        }
    }
}
