package com.friendoo.app.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.friendoo.app.presentation.theme.*

/**
 * Reusable top app bar with optional gradient background.
 * Uses Material 3 TopAppBar with coral/teal accent styling.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GradientAppBar(
    title: String,
    onBack: (() -> Unit)? = null,
    actions: @Composable RowScope.() -> Unit = {},
    gradient: Brush? = null,
    modifier: Modifier = Modifier
) {
    val containerColor = if (gradient != null) Color.Transparent else Surface

    TopAppBar(
        title = {
            Text(
                text = title,
                color = PureWhite,
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp
            )
        },
        navigationIcon = {
            if (onBack != null) {
                IconButton(onClick = onBack) {
                    Icon(
                        Icons.Default.ArrowBack,
                        contentDescription = "Back",
                        tint = PureWhite
                    )
                }
            }
        },
        actions = actions,
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = containerColor,
            scrolledContainerColor = Surface
        ),
        modifier = if (gradient != null) {
            modifier.background(gradient)
        } else {
            modifier
        }
    )
}

/**
 * Friendoo branded app bar with logo and optional coin balance display.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FriendooTopBar(
    modifier: Modifier = Modifier,
    actions: @Composable RowScope.() -> Unit = {}
) {
    TopAppBar(
        title = {
            Text(
                text = "friendoo",
                color = PureWhite,
                fontWeight = FontWeight.Bold,
                fontSize = 20.sp
            )
        },
        actions = actions,
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = Color.Transparent
        ),
        modifier = modifier
    )
}
