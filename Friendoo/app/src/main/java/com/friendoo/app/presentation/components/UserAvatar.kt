package com.friendoo.app.presentation.components

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * @deprecated Use [FriendooAvatar] with avatarSeed instead.
 * This composable is kept as a thin redirect for backward compatibility during migration.
 */
@Composable
fun UserAvatar(
    userId: String,
    modifier: Modifier = Modifier,
    size: Dp = 48.dp,
    avatarSeed: String = ""
) {
    FriendooAvatar(
        avatarSeed = avatarSeed.ifBlank { userId },
        size = size,
        modifier = modifier
    )
}
