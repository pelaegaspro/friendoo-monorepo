package com.friendoo.app.presentation.auth

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun OtpScreen(
    viewModel: AuthViewModel,
    onSuccess: () -> Unit
) {
    var code by remember { mutableStateOf("") }
    val authState by viewModel.authState.collectAsState()

    LaunchedEffect(authState) {
        if (authState is AuthState.Success) {
            onSuccess()
        }
    }

    Column(modifier = Modifier.padding(16.dp).fillMaxSize(), verticalArrangement = Arrangement.Center) {
        Text("Enter OTP", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(16.dp))
        OutlinedTextField(
            value = code,
            onValueChange = { code = it },
            label = { Text("6-digit Code") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(
            onClick = { viewModel.verifyCode(code) },
            enabled = authState !is AuthState.Loading,
            modifier = Modifier.fillMaxWidth()
        ) {
            if (authState is AuthState.Loading) {
                CircularProgressIndicator(modifier = Modifier.size(24.dp))
            } else {
                Text("Verify OTP")
            }
        }
        if (authState is AuthState.Error) {
            Spacer(modifier = Modifier.height(8.dp))
            Text((authState as AuthState.Error).message, color = MaterialTheme.colorScheme.error)
        }
    }
}
