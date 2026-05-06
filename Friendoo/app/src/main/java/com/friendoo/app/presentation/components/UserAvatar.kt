package com.friendoo.app.presentation.components

import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import coil.compose.AsyncImage

@Composable
fun UserAvatar(
    photoUrl: String,
    modifier: Modifier = Modifier
) {
    AsyncImage(
        model = photoUrl.ifEmpty { "https://ui-avatars.com/api/?name=User" },
        contentDescription = "User Avatar",
        modifier = modifier.clip(CircleShape)
    )
}
