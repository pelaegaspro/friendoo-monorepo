package com.friendoo.app.presentation.components

import androidx.compose.runtime.Composable
import androidx.navigation.NavController

@Composable
fun AuthGuard(
    navController: NavController,
    content: @Composable () -> Unit
) {
    content()
}
