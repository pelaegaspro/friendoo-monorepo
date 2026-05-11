package com.friendoo.app.presentation.auth

import android.app.Activity
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.friendoo.app.presentation.components.FriendooButton
import com.friendoo.app.presentation.theme.*

@Composable
fun LoginScreen(
    viewModel: AuthViewModel,
    onCodeSent: () -> Unit
) {
    var phone by remember { mutableStateOf("") }
    val authState by viewModel.authState.collectAsState()
    val context = LocalContext.current
    val isLoading = authState is AuthState.Loading
    val isError = authState is AuthState.Error

    LaunchedEffect(authState) {
        if (authState is AuthState.CodeSent) {
            onCodeSent()
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(WarmWhite)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp),
            verticalArrangement = Arrangement.Top
        ) {
            Spacer(modifier = Modifier.height(80.dp))

            // Branded Hero Illustration
            Box(
                modifier = Modifier
                    .size(160.dp)
                    .clip(CircleShape)
                    .background(Coral.copy(alpha = 0.1f))
                    .align(Alignment.CenterHorizontally),
                contentAlignment = Alignment.Center
            ) {
                // Abstract sound wave visual
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        "~",
                        fontSize = 72.sp,
                        color = Coral,
                        fontWeight = FontWeight.Light,
                        modifier = Modifier.offset(y = 8.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Wordmark
            Text(
                text = "friendoo",
                style = MaterialTheme.typography.displayLarge.copy(
                    color = Coral,
                    fontWeight = FontWeight.Bold
                ),
                modifier = Modifier.align(Alignment.CenterHorizontally)
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Headline
            Text(
                text = "Someone to talk to,\nanytime",
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                modifier = Modifier.align(Alignment.CenterHorizontally)
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Subtitle
            Text(
                text = "Anonymous voice calls. No photos. No judgment.",
                style = MaterialTheme.typography.bodyLarge,
                color = WarmGray,
                textAlign = TextAlign.Center,
                modifier = Modifier.align(Alignment.CenterHorizontally)
            )

            Spacer(modifier = Modifier.height(48.dp))

            // Phone input with country code
            Text(
                text = "Enter your phone number",
                style = MaterialTheme.typography.labelLarge,
                color = WarmGray,
                modifier = Modifier.padding(bottom = 8.dp)
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Country code selector
                Surface(
                    shape = InputShape,
                    color = SurfaceElevated,
                    modifier = Modifier.height(56.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderLight)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text("+", style = MaterialTheme.typography.bodyLarge, color = DeepNavy)
                        Text("91", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold, color = DeepNavy)
                    }
                }

                // Phone input
                OutlinedTextField(
                    value = phone,
                    onValueChange = { if (it.length <= 10) phone = it.filter { c -> c.isDigit() } },
                    placeholder = { Text("98765 43210", color = HintGray) },
                    modifier = Modifier.weight(1f),
                    shape = InputShape,
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Number,
                        imeAction = ImeAction.Done
                    ),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Coral,
                        unfocusedBorderColor = BorderLight,
                        focusedContainerColor = SurfaceElevated,
                        unfocusedContainerColor = SurfaceElevated
                    ),
                    leadingIcon = {
                        Icon(Icons.Default.Phone, contentDescription = null, tint = WarmGray)
                    }
                )
            }

            if (isError) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = (authState as AuthState.Error).message,
                    color = ErrorRed,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(start = 4.dp)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            FriendooButton(
                text = "Continue",
                onClick = { viewModel.sendOtp(phone, context as Activity) },
                enabled = phone.length >= 10 && !isLoading,
                isLoading = isLoading
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Terms caption
            Text(
                text = "By continuing, you agree to our Terms & Privacy Policy",
                style = MaterialTheme.typography.bodySmall,
                color = LightGray,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
        }

        // Test mode badge
        Surface(
            color = SoftYellow.copy(alpha = 0.2f),
            shape = PillShape,
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(top = 48.dp, end = 16.dp)
        ) {
            Text(
                "Test Mode",
                style = MaterialTheme.typography.labelSmall,
                color = WarningAmber,
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
            )
        }
    }
}
