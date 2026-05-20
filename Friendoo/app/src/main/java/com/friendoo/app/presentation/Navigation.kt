package com.friendoo.app.presentation

import android.net.Uri
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
import com.friendoo.app.presentation.auth.SplashScreen
import com.friendoo.app.core.model.CallType
import com.friendoo.app.presentation.call.CallEndScreen
import com.friendoo.app.presentation.call.CallScreen
import com.friendoo.app.presentation.call.CallViewModel
import com.friendoo.app.presentation.call.WaitingScreen
import com.friendoo.app.presentation.host.HostHomeScreen
import com.friendoo.app.presentation.home.HomeScreen
import com.friendoo.app.presentation.leaderboard.LeaderboardScreen
import com.friendoo.app.presentation.onboarding.OnboardingScreen
import com.friendoo.app.presentation.onboarding.OnboardingViewModel
import com.friendoo.app.presentation.profile.AvatarPickerScreen
import com.friendoo.app.presentation.report.ReportThreadScreen
import com.friendoo.app.presentation.rewards.RewardsScreen
import com.friendoo.app.presentation.wallet.EarningsScreen
import com.friendoo.app.presentation.wallet.HostWalletViewModel
import com.friendoo.app.presentation.wallet.UserTransactionsScreen
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
    val isHost by userPreferences.isHostFlow.collectAsState(initial = false)
    val userId by userPreferences.userIdFlow.collectAsState(initial = null)

    NavHost(navController = navController, startDestination = "splash") {
        composable("splash") {
            SplashScreen(
                authToken = authToken,
                onboardingCompleted = onboardingCompleted,
                isHost = isHost,
                onNavigateToHome = {
                    navController.navigate("home") {
                        popUpTo("splash") { inclusive = true }
                    }
                },
                onNavigateToOnboarding = {
                    navController.navigate("onboarding") {
                        popUpTo("splash") { inclusive = true }
                    }
                },
                onNavigateToLogin = {
                    navController.navigate("login") {
                        popUpTo("splash") { inclusive = true }
                    }
                },
                onNavigateToHostHome = {
                    navController.navigate("host_home") {
                        popUpTo("splash") { inclusive = true }
                    }
                }
            )
        }
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
                onSuccess = { onboardingCompleted, isHost ->
                    val destination = when {
                        !onboardingCompleted -> "onboarding"
                        isHost -> "host_home"
                        else -> "home"
                    }
                    navController.navigate(destination) {
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
            OnboardingScreen(viewModel) { isHost ->
                navController.navigate(if (isHost) "host_home" else "home") {
                    popUpTo("onboarding") { inclusive = true }
                }
            }
        }
        composable("home") {
            HomeScreen(
                onHostClick = { host, callType ->
                    val resolvedCallType = if (callType == CallType.VIDEO && !host.supportsVideo) {
                        CallType.AUDIO
                    } else {
                        callType
                    }
                    val rate = if (resolvedCallType == CallType.VIDEO) host.ratePerVideoMinute else host.ratePerAudioMinute
                    navController.navigate(
                        "call/${Uri.encode(host.uid)}/${Uri.encode(host.alias)}/${rate}/${resolvedCallType.value}/${Uri.encode(host.avatarSeed)}"
                    )
                },
                onLogoutSuccess = {
                    navController.navigate("login") {
                        popUpTo(0) { inclusive = true }
                    }
                },
                onNavigateToRewards = { navController.navigate("rewards") },
                onNavigateToLeaderboard = { navController.navigate("leaderboard") },
                onNavigateToEarnings = { navController.navigate("earnings") },
                onNavigateToAvatarPicker = { seed ->
                    navController.navigate("avatar_picker/${Uri.encode(seed)}")
                },
                onNavigateToWaiting = {
                    navController.navigate("waiting")
                }
            )
        }
        composable("host_home") {
            HostHomeScreen(
                onLogoutSuccess = {
                    navController.navigate("login") {
                        popUpTo(0) { inclusive = true }
                    }
                },
                onNavigateToSettings = { /* Settings screen not yet built */ },
                onNavigateToPerformance = { /* Performance screen not yet built */ }
            )
        }
        composable("waiting") {
            WaitingScreen(
                requestId = "quick_match_${System.currentTimeMillis()}",
                onMatched = { callId, hostAlias, hostColor ->
                    navController.navigate("call/quick/$hostAlias/5/audio/default") {
                        popUpTo("waiting") { inclusive = true }
                    }
                },
                onTimeout = {
                    navController.popBackStack()
                },
                onCancel = {
                    navController.popBackStack()
                }
            )
        }
        composable("rewards") {
            RewardsScreen(userId = userId, onBack = { navController.popBackStack() })
        }
        composable("leaderboard") {
            LeaderboardScreen(onBack = { navController.popBackStack() })
        }

        composable("earnings") {
            if (isHost) {
                val viewModel: HostWalletViewModel = hiltViewModel()
                EarningsScreen(viewModel) { navController.popBackStack() }
            } else {
                val viewModel: WalletViewModel = hiltViewModel()
                UserTransactionsScreen(viewModel) { navController.popBackStack() }
            }
        }
        composable("avatar_picker/{avatarSeed}") { backStackEntry ->
            val avatarSeed = backStackEntry.arguments?.getString("avatarSeed") ?: ""
            AvatarPickerScreen(
                avatarSeed = Uri.decode(avatarSeed),
                onBack = { navController.popBackStack() }
            )
        }
        composable("report_thread/{reportId}") { backStackEntry ->
            val reportId = backStackEntry.arguments?.getString("reportId") ?: return@composable
            ReportThreadScreen(
                reportId = reportId,
                onBack = { navController.popBackStack() }
            )
        }
        composable("call_end/{hostAlias}/{hostId}/{sessionId}") { backStackEntry ->
            val hostAlias = backStackEntry.arguments?.getString("hostAlias") ?: "Host"
            val hostId = backStackEntry.arguments?.getString("hostId") ?: ""
            val sessionId = backStackEntry.arguments?.getString("sessionId") ?: ""
            CallEndScreen(
                hostAlias = hostAlias,
                hostId = hostId,
                sessionId = sessionId,
                onFinish = {
                    navController.navigate("home") {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
        composable("call/{hostUid}/{hostAlias}/{ratePerMinute}/{callType}/{hostAvatarSeed}") { backStackEntry ->
            val hostUid = backStackEntry.arguments?.getString("hostUid") ?: return@composable
            val hostAlias = Uri.decode(backStackEntry.arguments?.getString("hostAlias") ?: "Host")
            val ratePerMinute = backStackEntry.arguments?.getString("ratePerMinute")?.toIntOrNull() ?: 5
            val callTypeStr = backStackEntry.arguments?.getString("callType") ?: "audio"
            val callType = CallType.fromString(callTypeStr)
            val hostAvatarSeed = Uri.decode(backStackEntry.arguments?.getString("hostAvatarSeed") ?: hostUid)
            val viewModel: CallViewModel = hiltViewModel()
            CallScreen(
                viewModel = viewModel,
                receiverId = hostUid,
                otherUserAlias = hostAlias,
                otherUserAvatarSeed = hostAvatarSeed,
                ratePerMinute = ratePerMinute,
                callType = callType,
                onEndCall = { sessionId ->
                    navController.navigate("call_end/$hostAlias/$hostUid/$sessionId") {
                        popUpTo("call/{hostUid}/{hostAlias}/{ratePerMinute}/{callType}/{hostAvatarSeed}") { inclusive = true }
                    }
                }
            )
        }
    }
}
