package com.friendoo.app.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.friendoo.app.presentation.theme.*

/**
 * 6-digit OTP input with equal-width boxes.
 * Focused box has coral border/shadow; filled boxes have subtle elevated state.
 */
@Composable
fun FriendooOtpInput(
    otpDigits: List<String>,
    onDigitChange: (Int, String) -> Unit,
    isError: Boolean = false,
    modifier: Modifier = Modifier
) {
    val focusRequesters = remember { List(6) { FocusRequester() } }

    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        repeat(6) { index ->
            val isFilled = otpDigits[index].isNotEmpty()
            val isFocused = index == otpDigits.indexOfFirst { it.isEmpty() }.coerceAtLeast(0)

            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(60.dp)
                    .border(
                        width = if (isError) 2.dp else if (isFilled) 1.5.dp else 1.dp,
                        color = when {
                            isError -> ErrorRed
                            isFilled -> Coral
                            isFocused -> Coral.copy(alpha = 0.5f)
                            else -> BorderLight
                        },
                        shape = RoundedCornerShape(12.dp)
                    )
                    .clip(RoundedCornerShape(12.dp))
                    .background(
                        when {
                            isFilled -> SurfaceElevated.copy(alpha = 0.8f)
                            else -> SurfaceElevated
                        }
                    ),
                contentAlignment = Alignment.Center
            ) {
                TextField(
                    value = otpDigits[index],
                    onValueChange = { value ->
                        if (value.length <= 1) {
                            onDigitChange(index, value.filter { it.isDigit() })
                            // Auto-advance focus
                            if (value.isNotEmpty() && index < 5) {
                                focusRequesters[index + 1].requestFocus()
                            }
                        }
                    },
                    textStyle = TextStyle(
                        color = PureWhite,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center
                    ),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color.Transparent,
                        unfocusedContainerColor = Color.Transparent,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent,
                        cursorColor = Coral
                    ),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxSize()
                        .focusRequester(focusRequesters[index])
                )
            }
        }
    }
}
