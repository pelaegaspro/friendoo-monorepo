package com.friendoo.app.presentation.auth

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.friendoo.app.presentation.components.FriendooButton
import com.friendoo.app.presentation.components.FriendooOtpInput
import com.friendoo.app.presentation.theme.*

@Composable
fun OtpScreen(
    viewModel: AuthViewModel,
    onSuccess: () -> Unit,
    onBack: () -> Unit
) {
    var code by remember { mutableStateOf("") }
    var timeLeft by remember { mutableStateOf(45) }
    var canResend by remember { mutableStateOf(false) }
    val authState by viewModel.authState.collectAsState()
    val isLoading = authState is AuthState.Loading
    val isError = authState is AuthState.Error

    LaunchedEffect(authState) {
        if (authState is AuthState.Success) {
            onSuccess()
        }
    }

    // Countdown timer
    LaunchedEffect(canResend) {
        if (!canResend) {
            timeLeft = 45
            while (timeLeft > 0) {
                kotlinx.coroutines.delay(1000)
                timeLeft--
            }
            canResend = true
        }
    }

    // Auto-fill test code for easier testing
    LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(800)
        code = "123456"
    }

    Box(modifier = Modifier.fillMaxSize().background(WarmWhite)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp)
        ) {
            // Back button
            IconButton(
                onClick = onBack,
                modifier = Modifier.padding(top = 16.dp)
            ) {
                Icon(
                    Icons.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = DeepNavy
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Headline
            Text(
                text = "Enter the code",
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Subtitle with masked phone
            Text(
                text = "We sent a 6-digit code to\n+91 **** ****",
                style = MaterialTheme.typography.bodyLarge,
                color = WarmGray
            )

            Spacer(modifier = Modifier.height(48.dp))

            // 6 OTP boxes
            FriendooOtpInput(
                otp = code,
                onOtpChange = { code = it },
                modifier = Modifier.fillMaxWidth()
            )

            if (isError) {
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = (authState as AuthState.Error).message,
                    color = ErrorRed,
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            FriendooButton(
                text = "Verify",
                onClick = { viewModel.verifyCode(code) },
                enabled = code.length == 6 && !isLoading,
                isLoading = isLoading
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Resend row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (canResend) {
                    TextButton(onClick = {
                        canResend = false
                        // Trigger resend
                    }) {
                        Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Resend code", color = Coral, fontWeight = FontWeight.SemiBold)
                    }
                } else {
                    Text(
                        text = "Resend in 00:${timeLeft.toString().padStart(2, '0')}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = LightGray
                    )
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            // Demo code hint
            Surface(
                shape = PillShape,
                color = SurfaceElevated,
                modifier = Modifier.align(Alignment.CenterHorizontally)
            ) {
                Text(
                    "Demo code: 123456",
                    style = MaterialTheme.typography.labelMedium,
                    color = LightGray,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                )
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}
