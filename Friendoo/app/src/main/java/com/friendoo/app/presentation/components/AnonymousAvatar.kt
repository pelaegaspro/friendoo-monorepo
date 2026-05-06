package com.friendoo.app.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.friendoo.app.core.utils.AnonymityUtils

@Composable
fun AnonymousAvatar(
    alias: String,
    avatarColorHex: String,
    modifier: Modifier = Modifier,
    size: Dp = 48.dp,
    fontSize: Int = 18
) {
    val backgroundColor = AnonymityUtils.hexToColor(avatarColorHex)
    
    Box(
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .background(backgroundColor),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = alias.take(2).uppercase(),
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = fontSize.sp
        )
    }
}
