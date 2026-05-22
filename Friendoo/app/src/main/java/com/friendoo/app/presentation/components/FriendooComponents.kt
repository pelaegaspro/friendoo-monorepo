package com.friendoo.app.presentation.components

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import com.friendoo.app.presentation.theme.*

// === FRIENDOO BUTTON ===
@Composable
fun FriendooButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    isLoading: Boolean = false,
    isGradient: Boolean = true,
    isOutlined: Boolean = false
) {
    val scale by animateFloatAsState(
        targetValue = if (enabled) 1f else 0.97f,
        label = "button_scale"
    )

    val brush = if (isGradient && !isOutlined) {
        Brush.horizontalGradient(listOf(GradientStart, GradientEnd))
    } else null

    val containerColor = when {
        isOutlined -> Color.Transparent
        isGradient -> Color.Transparent
        else -> Violet
    }

    Button(
        onClick = onClick,
        enabled = enabled && !isLoading,
        modifier = modifier
            .fillMaxWidth()
            .height(52.dp)
            .scale(scale),
        shape = RoundedCornerShape(16.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = containerColor,
            disabledContainerColor = if (isGradient) Color.Transparent else MaterialTheme.colorScheme.outline
        ),
        border = if (isOutlined) androidx.compose.foundation.BorderStroke(1.5.dp, Violet) else null
    ) {
        Box(
            modifier = if (brush != null) Modifier.background(brush, RoundedCornerShape(16.dp)) else Modifier,
            contentAlignment = Alignment.Center
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = if (isOutlined) Violet else PureWhite,
                    strokeWidth = 2.dp
                )
            } else {
                Text(
                    text = text,
                    color = if (isOutlined) Violet else PureWhite,
                    style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold)
                )
            }
        }
    }
}

// === FRIENDOO CARD ===
@Composable
fun FriendooCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier,
        shape = CardShape,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            content()
        }
    }
}

// === FRIENDOO OTP INPUT ===
@Composable
fun FriendooOtpInput(
    otp: String,
    onOtpChange: (String) -> Unit,
    length: Int = 6,
    modifier: Modifier = Modifier
) {
    val friendooColors = LocalFriendooColors.current
    val focusRequester = remember { FocusRequester() }

    // Custom blinking cursor animation
    val infiniteTransition = rememberInfiniteTransition(label = "otp_cursor")
    val cursorAlpha by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(500, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "otp_cursor_alpha"
    )

    Box(
        modifier = modifier.fillMaxWidth(),
        contentAlignment = Alignment.Center
    ) {
        // Hidden BasicTextField that captures all inputs
        BasicTextField(
            value = otp,
            onValueChange = { newVal ->
                if (newVal.length <= length && newVal.all { it.isDigit() }) {
                    onOtpChange(newVal)
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .focusRequester(focusRequester),
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Number,
                imeAction = ImeAction.Done
            ),
            // Hide the text and system cursor
            textStyle = TextStyle(color = Color.Transparent),
            cursorBrush = SolidColor(Color.Transparent),
            decorationBox = {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    repeat(length) { index ->
                        val char = otp.getOrNull(index)?.toString() ?: ""
                        val isFocused = index == otp.length

                        val scale by animateFloatAsState(
                            targetValue = if (isFocused) 1.05f else 1f,
                            label = "otp_scale_$index"
                        )

                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .aspectRatio(0.85f)
                                .scale(scale)
                                .clip(RoundedCornerShape(14.dp))
                                .background(
                                    if (char.isNotEmpty()) Violet.copy(alpha = 0.1f) else MaterialTheme.colorScheme.surfaceVariant
                                )
                                .border(
                                    width = if (isFocused) 2.dp else 1.dp,
                                    color = if (isFocused) Violet else MaterialTheme.colorScheme.outline,
                                    shape = RoundedCornerShape(14.dp)
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            if (isFocused) {
                                // Draw a blinking vertical cursor
                                Box(
                                    modifier = Modifier
                                        .width(2.dp)
                                        .height(24.dp)
                                        .background(Violet.copy(alpha = cursorAlpha))
                                )
                            } else {
                                Text(
                                    text = char,
                                    style = TextStyle(
                                        fontSize = 24.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = friendooColors.textPrimary,
                                        textAlign = TextAlign.Center
                                    )
                                )
                            }
                        }
                    }
                }
            }
        )
    }

    // Auto-focus the hidden field on display
    LaunchedEffect(Unit) {
        try {
            focusRequester.requestFocus()
        } catch (e: Exception) {
            // Ignore focus failures during startup layout
        }
    }
}

// === FRIENDOO HOST CARD ===
@Composable
fun FriendooHostCard(
    alias: String,
    avatarSeed: String,
    tags: List<String>,
    pricePerMin: String,
    isOnline: Boolean = true,
    isStar: Boolean = false,
    onCallClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val friendooColors = LocalFriendooColors.current
    FriendooCard(modifier = modifier) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth()
        ) {
            Box(contentAlignment = Alignment.BottomEnd) {
                FriendooAvatar(avatarSeed = avatarSeed, size = 56.dp)
                if (isOnline) {
                    Box(
                        modifier = Modifier
                            .size(14.dp)
                            .clip(CircleShape)
                            .background(SuccessGreen)
                            .border(2.dp, MaterialTheme.colorScheme.surface, CircleShape)
                    )
                }
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = alias,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = friendooColors.textPrimary,
                maxLines = 1
            )
            if (isStar) {
                Surface(
                    color = WarningAmber.copy(alpha = 0.15f),
                    shape = ChipShape,
                    modifier = Modifier.padding(top = 4.dp)
                ) {
                    Text(
                        "Star Host",
                        style = MaterialTheme.typography.labelSmall,
                        color = WarningAmber,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.height(6.dp))
            Row(
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                tags.take(2).forEach { tag ->
                    Surface(
                        color = Violet.copy(alpha = 0.08f),
                        shape = ChipShape
                    ) {
                        Text(
                            tag,
                            style = MaterialTheme.typography.labelSmall,
                            color = Violet,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = pricePerMin,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold,
                    color = Violet
                )
                Button(
                    onClick = onCallClick,
                    shape = PillShape,
                    colors = ButtonDefaults.buttonColors(containerColor = Violet),
                    modifier = Modifier.height(30.dp),
                    contentPadding = PaddingValues(horizontal = 14.dp)
                ) {
                    Text("Call", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

// === FRIENDOO MESSAGE BUBBLE ===
@Composable
fun FriendooMessageBubble(
    text: String,
    isMine: Boolean,
    timestamp: String = "",
    modifier: Modifier = Modifier
) {
    val friendooColors = LocalFriendooColors.current
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = if (isMine) Arrangement.End else Arrangement.Start
    ) {
        Column(horizontalAlignment = if (isMine) Alignment.End else Alignment.Start) {
            Surface(
                shape = RoundedCornerShape(
                    topStart = 16.dp,
                    topEnd = 16.dp,
                    bottomStart = if (isMine) 16.dp else 4.dp,
                    bottomEnd = if (isMine) 4.dp else 16.dp
                ),
                color = if (isMine) Violet else MaterialTheme.colorScheme.surface,
                modifier = Modifier.widthIn(max = 280.dp),
                border = if (!isMine) androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline) else null
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(
                        text = text,
                        color = if (isMine) PureWhite else friendooColors.textPrimary,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
            if (timestamp.isNotEmpty()) {
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = timestamp,
                    style = MaterialTheme.typography.labelSmall,
                    color = friendooColors.textHint
                )
            }
        }
    }
}

// === FRIENDOO GRADIENT HEADER ===
@Composable
fun FriendooGradientHeader(
    modifier: Modifier = Modifier,
    isMidnight: Boolean = false,
    height: Dp = 200.dp,
    content: @Composable BoxScope.() -> Unit
) {
    val brush = if (isMidnight) {
        Brush.verticalGradient(listOf(MidnightPlum, DeepIndigo))
    } else {
        Brush.horizontalGradient(listOf(GradientStart, GradientEnd))
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(height)
            .background(brush),
        contentAlignment = Alignment.Center,
        content = content
    )
}

// === FRIENDOO EMPTY STATE ===
@Composable
fun FriendooEmptyState(
    title: String,
    subtitle: String = "",
    actionText: String = "",
    onAction: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val friendooColors = LocalFriendooColors.current
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(72.dp)
                .clip(CircleShape)
                .background(Violet.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "~",
                fontSize = 32.sp,
                color = Violet,
                fontWeight = FontWeight.Light
            )
        }
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            color = friendooColors.textPrimary,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )
        if (subtitle.isNotEmpty()) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = friendooColors.textSecondary,
                textAlign = TextAlign.Center
            )
        }
        if (actionText.isNotEmpty()) {
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = onAction,
                shape = ButtonShape,
                colors = ButtonDefaults.buttonColors(containerColor = Violet)
            ) {
                Text(actionText, fontWeight = FontWeight.Bold)
            }
        }
    }
}

// === FRIENDOO SHIMMER LOADING ===
@Composable
fun FriendooShimmerItem(
    modifier: Modifier = Modifier,
    isCircle: Boolean = false
) {
    val shimmerColors = listOf(
        MaterialTheme.colorScheme.outline,
        Violet.copy(alpha = 0.08f),
        MaterialTheme.colorScheme.outline
    )
    val transition = rememberInfiniteTransition(label = "shimmer")
    val translateAnim by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1000f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "shimmer_translate"
    )
    val brush = Brush.linearGradient(
        colors = shimmerColors,
        start = androidx.compose.ui.geometry.Offset.Zero,
        end = androidx.compose.ui.geometry.Offset(x = translateAnim, y = translateAnim)
    )

    Box(
        modifier = modifier
            .clip(if (isCircle) CircleShape else RoundedCornerShape(12.dp))
            .background(brush)
    )
}

// === AUDIO WAVEFORM ===
@Composable
fun AudioWaveform(
    modifier: Modifier = Modifier,
    barCount: Int = 20,
    isActive: Boolean = true
) {
    val infiniteTransition = rememberInfiniteTransition(label = "waveform")

    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(3.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        repeat(barCount) { index ->
            val delay = index * 50
            val heightFraction by infiniteTransition.animateFloat(
                initialValue = 0.2f,
                targetValue = if (isActive) 1f else 0.2f,
                animationSpec = infiniteRepeatable(
                    animation = tween(600 + delay, easing = FastOutSlowInEasing),
                    repeatMode = RepeatMode.Reverse
                ),
                label = "bar_$index"
            )

            Box(
                modifier = Modifier
                    .width(3.dp)
                    .heightIn(min = 4.dp, max = 32.dp)
                    .height(32.dp * heightFraction)
                    .clip(RoundedCornerShape(2.dp))
                    .background(
                        if (isActive) Violet.copy(alpha = 0.6f + (index % 3) * 0.15f)
                        else MaterialTheme.colorScheme.outline
                    )
            )
        }
    }
}

// === FRIENDOO PRICE PILL ===
@Composable
fun FriendooPricePill(
    price: String,
    modifier: Modifier = Modifier
) {
    val friendooColors = LocalFriendooColors.current
    Surface(
        shape = PillShape,
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.9f),
        modifier = modifier
    ) {
        Text(
            text = price,
            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
            color = friendooColors.textPrimary,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
        )
    }
}

// === FRIENDOO SECTION HEADER ===
@Composable
fun FriendooSectionHeader(
    title: String,
    actionText: String = "",
    onAction: () -> Unit = {}
) {
    val friendooColors = LocalFriendooColors.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = friendooColors.textPrimary
        )
        if (actionText.isNotEmpty()) {
            TextButton(onClick = onAction) {
                Text(actionText, color = Violet, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

// === FRIENDOO ONLINE DOT ===
@Composable
fun FriendooOnlineDot(modifier: Modifier = Modifier, size: Dp = 10.dp) {
    Box(
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .background(SuccessGreen)
            .border((size.value * 0.15f).dp, MaterialTheme.colorScheme.surface, CircleShape)
    )
}
