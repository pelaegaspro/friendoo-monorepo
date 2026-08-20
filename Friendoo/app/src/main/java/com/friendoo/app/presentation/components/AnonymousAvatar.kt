package com.friendoo.app.presentation.components

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * @deprecated Use [FriendooAvatar] with avatarSeed instead.
 * This composable is kept as a thin redirect for backward compatibility during migration.
 * It delegates to [FriendooAvatar] which uses avatarSeed as the canonical seed.
 */
@Composable
fun AnonymousAvatar(
    alias: String,
    avatarColorHex: String = "#6200EE",
    modifier: Modifier = Modifier,
    size: Dp = 48.dp,
    fontSize: Int = 18,
    avatarSeed: String = ""
) {
    // During migration, prefer avatarSeed if provided; otherwise fall back to alias.
    // After full migration, all callers should pass avatarSeed directly.
    FriendooAvatar(
        avatarSeed = avatarSeed.ifBlank { alias },
        size = size,
        modifier = modifier
    )
}
