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
    onSuccess: (onboardingCompleted: Boolean, isHost: Boolean) -> Unit,
    onBack: () -> Unit
) {
    var code by remember { mutableStateOf("") }
    var timeLeft by remember { mutableStateOf(45) }
    var canResend by remember { mutableStateOf(false) }
    val authState by viewModel.authState.collectAsState()
    val isLoading = authState is AuthState.Loading
    val isError = authState is AuthState.Error
    val friendooColors = LocalFriendooColors.current

    LaunchedEffect(authState) {
        val state = authState
        if (state is AuthState.Success) {
            onSuccess(state.onboardingCompleted, state.isHost)
        }
    }

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

    LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(800)
        code = "123456"
    }

    Box(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp)
        ) {
            IconButton(
                onClick = onBack,
                modifier = Modifier.padding(top = 16.dp)
            ) {
                Icon(
                    Icons.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = friendooColors.textPrimary
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Enter the code",
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold,
                color = friendooColors.textPrimary
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "We sent a 6-digit code to\n+91 **** ****",
                style = MaterialTheme.typography.bodyLarge,
                color = friendooColors.textSecondary
            )

            Spacer(modifier = Modifier.height(48.dp))

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

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (canResend) {
                    TextButton(onClick = {
                        canResend = false
                    }) {
                        Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp), tint = Violet)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Resend code", color = Violet, fontWeight = FontWeight.SemiBold)
                    }
                } else {
                    Text(
                        text = "Resend in 00:${timeLeft.toString().padStart(2, '0')}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = friendooColors.textHint
                    )
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            Surface(
                shape = PillShape,
                color = MaterialTheme.colorScheme.surfaceVariant,
                modifier = Modifier.align(Alignment.CenterHorizontally)
            ) {
                Text(
                    "Demo code: 123456",
                    style = MaterialTheme.typography.labelMedium,
                    color = friendooColors.textHint,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                )
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}
