package com.friendoo.app.presentation.auth

import android.app.Activity
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp

@Composable
fun LoginScreen(
    viewModel: AuthViewModel,
    onCodeSent: () -> Unit
) {
    var phone by remember { mutableStateOf("") }
    val authState by viewModel.authState.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(authState) {
        if (authState is AuthState.CodeSent) {
            onCodeSent()
        }
    }

    Column(modifier = Modifier.padding(16.dp).fillMaxSize(), verticalArrangement = Arrangement.Center) {
        Text("Login with Phone", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(16.dp))
        OutlinedTextField(
            value = phone,
            onValueChange = { phone = it },
            label = { Text("Phone Number (+91...)") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(
            onClick = { viewModel.sendOtp(phone, context as Activity) },
            enabled = authState !is AuthState.Loading,
            modifier = Modifier.fillMaxWidth()
        ) {
            if (authState is AuthState.Loading) {
                CircularProgressIndicator(modifier = Modifier.size(24.dp))
            } else {
                Text("Send OTP")
            }
        }
        if (authState is AuthState.Error) {
            Spacer(modifier = Modifier.height(8.dp))
            Text((authState as AuthState.Error).message, color = MaterialTheme.colorScheme.error)
        }
    }
}
