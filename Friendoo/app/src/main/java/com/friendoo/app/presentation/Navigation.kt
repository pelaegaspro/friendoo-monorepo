package com.friendoo.app.presentation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
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
import com.friendoo.app.presentation.chat.ChatListScreen
import com.friendoo.app.presentation.chat.ChatRoomScreen
import com.friendoo.app.presentation.chat.ChatViewModel
import com.friendoo.app.presentation.discover.DiscoverScreen
import com.friendoo.app.presentation.discover.DiscoverViewModel
import com.friendoo.app.presentation.onboarding.OnboardingScreen
import com.friendoo.app.presentation.onboarding.OnboardingViewModel
import com.friendoo.app.presentation.profile.ProfileScreen
import com.friendoo.app.presentation.profile.ProfileViewModel
import com.friendoo.app.presentation.wallet.HostWalletViewModel
import com.friendoo.app.presentation.wallet.WalletScreen
import com.friendoo.app.presentation.wallet.WalletViewModel

@Composable
fun AppNavigation(navController: NavHostController) {
    NavHost(navController = navController, startDestination = "login") {
        composable("login") {
            val viewModel: AuthViewModel = hiltViewModel()
            LoginScreen(viewModel) {
                navController.navigate("otp")
            }
        }
        composable("otp") {
            val viewModel: AuthViewModel = hiltViewModel()
            OtpScreen(viewModel) {
                navController.navigate("onboarding") {
                    popUpTo("login") { inclusive = true }
                }
            }
        }
        composable("onboarding") {
            val viewModel: OnboardingViewModel = hiltViewModel()
            OnboardingScreen(viewModel) {
                navController.navigate("discover") {
                    popUpTo("onboarding") { inclusive = true }
                }
            }
        }
        composable("discover") {
            val viewModel: DiscoverViewModel = hiltViewModel()
            DiscoverScreen(viewModel) { token, hostId ->
                navController.navigate("call/$token/$hostId/12345") 
            }
        }
        composable("profile") {
            val viewModel: ProfileViewModel = hiltViewModel()
            ProfileScreen(viewModel) {
                navController.navigate("login") {
                    popUpTo("discover") { inclusive = true }
                }
            }
        }
        composable("chatList") {
            ChatListScreen { otherUserId, otherUserName ->
                navController.navigate("chatRoom/$otherUserId/$otherUserName")
            }
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
        composable("wallet") {
            val viewModel: WalletViewModel = hiltViewModel()
            val hostViewModel: HostWalletViewModel = hiltViewModel()
            val profileViewModel: ProfileViewModel = hiltViewModel()
            WalletScreen(viewModel, hostViewModel, profileViewModel.userPreferences)
        }
    }
}
