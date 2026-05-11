package com.friendoo.app.presentation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.friendoo.app.data.local.UserPreferences
import com.friendoo.app.presentation.auth.AuthViewModel
import com.friendoo.app.presentation.auth.LoginScreen
import com.friendoo.app.presentation.auth.OtpScreen
import com.friendoo.app.presentation.call.CallScreen
import com.friendoo.app.presentation.call.CallViewModel
import com.friendoo.app.presentation.chat.ChatRoomScreen
import com.friendoo.app.presentation.chat.ChatViewModel
import com.friendoo.app.presentation.home.HomeScreen
import com.friendoo.app.presentation.leaderboard.LeaderboardScreen
import com.friendoo.app.presentation.onboarding.OnboardingScreen
import com.friendoo.app.presentation.onboarding.OnboardingViewModel
import com.friendoo.app.presentation.rewards.RewardsScreen
import com.friendoo.app.presentation.wallet.EarningsScreen
import com.friendoo.app.presentation.wallet.WalletViewModel
import javax.inject.Inject

@Composable
fun AppNavigation(
    navController: NavHostController,
    userPreferences: UserPreferences
) {
    // Determine start destination based on persisted login state
    val authToken by userPreferences.authTokenFlow.collectAsState(initial = null)
    val onboardingCompleted by userPreferences.onboardingCompletedFlow.collectAsState(initial = false)

    var startDestination by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(authToken, onboardingCompleted) {
        startDestination = when {
            authToken.isNullOrEmpty() -> "login"
            !onboardingCompleted -> "onboarding"
            else -> "home"
        }
    }

    if (startDestination == null) return

    NavHost(navController = navController, startDestination = startDestination!!) {
        composable("login") {
            val viewModel: AuthViewModel = hiltViewModel()
            LoginScreen(viewModel) {
                navController.navigate("otp")
            }
        }
        composable("otp") {
            val viewModel: AuthViewModel = hiltViewModel()
            OtpScreen(
                viewModel = viewModel,
                onSuccess = {
                    navController.navigate("onboarding") {
                        popUpTo("login") { inclusive = true }
                    }
                },
                onBack = {
                    navController.popBackStack()
                }
            )
        }
        composable("onboarding") {
            val viewModel: OnboardingViewModel = hiltViewModel()
            OnboardingScreen(viewModel) {
                navController.navigate("home") {
                    popUpTo("onboarding") { inclusive = true }
                }
            }
        }
        composable("home") {
            HomeScreen(
                onHostClick = { host ->
                    navController.navigate("call/${host.uid}/${host.alias}/${host.ratePerAudioMinute}")
                },
                onChatClick = { otherUserId, otherUserName ->
                    navController.navigate("chatRoom/$otherUserId/$otherUserName")
                },
                onLogoutSuccess = {
                    navController.navigate("login") {
                        popUpTo(0) { inclusive = true }
                    }
                },
                onNavigateToRewards = { navController.navigate("rewards") },
                onNavigateToLeaderboard = { navController.navigate("leaderboard") },
                onNavigateToEarnings = { navController.navigate("earnings") }
            )
        }
        composable("rewards") {
            RewardsScreen(onBack = { navController.popBackStack() })
        }
        composable("leaderboard") {
            LeaderboardScreen()
        }
        composable("earnings") {
            val viewModel: WalletViewModel = hiltViewModel()
            EarningsScreen(viewModel) { navController.popBackStack() }
        }
        composable("chatRoom/{userId}/{userName}") { backStackEntry ->
            val userId = backStackEntry.arguments?.getString("userId") ?: return@composable
            val userName = backStackEntry.arguments?.getString("userName") ?: "Host"
            val viewModel: ChatViewModel = hiltViewModel()
            ChatRoomScreen(viewModel, userId, userName, onBack = {
                navController.popBackStack()
            }, onNavigateToCall = {
                navController.navigate("call/temp_token/$userId/12345")
            })
        }
        composable("call/{token}/{channelName}/{uid}") { backStackEntry ->
            val token = backStackEntry.arguments?.getString("token") ?: ""
            val channelName = backStackEntry.arguments?.getString("channelName") ?: ""
            val uid = backStackEntry.arguments?.getString("uid")?.toIntOrNull() ?: 0
            val viewModel: CallViewModel = hiltViewModel()
            CallScreen(viewModel, channelName, uid, token) {
                navController.popBackStack()
            }
        }
    }
}
