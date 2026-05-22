package com.friendoo.app.presentation

import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.navigation
import com.friendoo.app.data.local.UserPreferences
import com.friendoo.app.presentation.auth.AuthViewModel
import com.friendoo.app.presentation.auth.LoginScreen
import com.friendoo.app.presentation.auth.OtpScreen
import com.friendoo.app.presentation.auth.SplashScreen
import com.friendoo.app.core.model.CallType
import com.friendoo.app.presentation.call.CallEndScreen
import com.friendoo.app.presentation.call.CallScreen
import com.friendoo.app.presentation.call.CallViewModel
import com.friendoo.app.presentation.host.HostHomeScreen
import com.friendoo.app.presentation.home.HomeScreen
import com.friendoo.app.presentation.onboarding.OnboardingScreen
import com.friendoo.app.presentation.onboarding.OnboardingViewModel
import com.friendoo.app.presentation.profile.AvatarPickerScreen
import com.friendoo.app.presentation.rewards.RewardsScreen
import com.friendoo.app.presentation.wallet.EarningsScreen
import com.friendoo.app.presentation.wallet.HostWalletViewModel
import com.friendoo.app.presentation.wallet.UserTransactionsScreen
import com.friendoo.app.presentation.wallet.WalletViewModel
import javax.inject.Inject
import com.google.firebase.firestore.FirebaseFirestore

@Composable
fun AppNavigation(
    navController: NavHostController,
    userPreferences: UserPreferences,
    pendingIncomingCallId: String? = null
) {
    // Determine start destination based on persisted login state
    val authToken by userPreferences.authTokenFlow.collectAsState(initial = null)
    val onboardingCompleted by userPreferences.onboardingCompletedFlow.collectAsState(initial = false)
    val isHost by userPreferences.isHostFlow.collectAsState(initial = false)
    val userId by userPreferences.userIdFlow.collectAsState(initial = null)

    val firestore = remember { FirebaseFirestore.getInstance() }
    var activeCallRoute by remember { mutableStateOf<String?>(null) }

    DisposableEffect(userId) {
        val uid = userId ?: return@DisposableEffect onDispose {}
        val activeStates = listOf("ringing", "connecting", "accepted", "active")

        // Listen for calls where current user is the CALLER
        val callerListener = firestore.collection("calls")
            .whereEqualTo("callerId", uid)
            .whereIn("state", activeStates)
            .addSnapshotListener { snapshot, error ->
                if (error != null) return@addSnapshotListener
                val docs = snapshot?.documents ?: return@addSnapshotListener
                for (doc in docs) {
                    val data = doc.data ?: continue
                    val peerAlias = data["toDisplayName"] as? String ?: "Host"
                    val rate = (data["ratePerMinute"] as? Long)?.toInt() ?: 5
                    val callTypeVal = data["callType"] as? String ?: "audio"
                    val peerAvatarSeed = data["hostId"] as? String ?: ""
                    activeCallRoute = "call/${Uri.encode(peerAvatarSeed)}/${Uri.encode(peerAlias)}/$rate/$callTypeVal/${Uri.encode(peerAvatarSeed)}"
                    return@addSnapshotListener
                }
                activeCallRoute = null
            }

        // Listen for calls where current user is the HOST
        val hostListener = firestore.collection("calls")
            .whereEqualTo("hostId", uid)
            .whereIn("state", activeStates)
            .addSnapshotListener { snapshot, error ->
                if (error != null) return@addSnapshotListener
                val docs = snapshot?.documents ?: return@addSnapshotListener
                for (doc in docs) {
                    val data = doc.data ?: continue
                    val callId = doc.id
                    val peerAlias = data["fromDisplayName"] as? String ?: "User"
                    val rate = (data["ratePerMinute"] as? Long)?.toInt() ?: 5
                    val callTypeVal = data["callType"] as? String ?: "audio"
                    val peerAvatarSeed = data["callerId"] as? String ?: ""
                    activeCallRoute = "call/join/${Uri.encode(callId)}/${Uri.encode(peerAlias)}/$rate/$callTypeVal/${Uri.encode(peerAvatarSeed)}"
                    return@addSnapshotListener
                }
                // Only clear if no active call found as caller either
                if (activeCallRoute?.startsWith("call/join") == true) {
                    activeCallRoute = null
                }
            }

        onDispose {
            callerListener.remove()
            hostListener.remove()
        }
    }

    LaunchedEffect(activeCallRoute) {
        val route = activeCallRoute ?: return@LaunchedEffect
        val currentRoute = navController.currentBackStackEntry?.destination?.route
        if (currentRoute != null && !currentRoute.startsWith("call")) {
            navController.navigate(route) {
                popUpTo("splash") { inclusive = true }
            }
        }
    }

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
                    navController.navigate("home") {
                        popUpTo("splash") { inclusive = true }
                    }
                },
                onNavigateToLogin = {
                    navController.navigate("auth") {
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
        navigation(startDestination = "login", route = "auth") {
            composable("login") { backStackEntry ->
                val authEntry = remember(backStackEntry) {
                    navController.getBackStackEntry("auth")
                }
                val viewModel: AuthViewModel = hiltViewModel(authEntry)
                LoginScreen(viewModel) {
                    navController.navigate("otp")
                }
            }
            composable("otp") { backStackEntry ->
                val authEntry = remember(backStackEntry) {
                    navController.getBackStackEntry("auth")
                }
                val viewModel: AuthViewModel = hiltViewModel(authEntry)
                OtpScreen(
                    viewModel = viewModel,
                    onSuccess = { onboardingCompleted, isHost ->
                        val destination = when {
                            isHost -> "host_home"
                            else -> "home"
                        }
                        navController.navigate(destination) {
                            popUpTo("auth") { inclusive = true }
                        }
                    },
                    onBack = { navController.popBackStack() }
                )
            }
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
                    navController.navigate("auth") {
                        popUpTo(0) { inclusive = true }
                    }
                },
                onNavigateToRewards = { navController.navigate("rewards") },
                onNavigateToEarnings = { navController.navigate("earnings") },
                onNavigateToAvatarPicker = { seed ->
                    navController.navigate("avatar_picker/${Uri.encode(seed)}")
                },
                onQuickMatch = {
                    navController.navigate("waiting")
                }
            )
        }
        composable("host_home") {
            LaunchedEffect(pendingIncomingCallId) {
                if (!pendingIncomingCallId.isNullOrBlank()) {
                    // Host home IncomingCallViewModel picks up ringing doc from Firestore listener.
                }
            }
            HostHomeScreen(
                onLogoutSuccess = {
                    navController.navigate("auth") {
                        popUpTo(0) { inclusive = true }
                    }
                },
                onNavigateToSettings = { /* Settings screen not yet built */ },
                onNavigateToPerformance = { /* Performance screen not yet built */ },
                onJoinIncomingCall = { callId, callerAlias, rate, callType ->
                    navController.navigate(
                        "call/join/${Uri.encode(callId)}/${Uri.encode(callerAlias)}/$rate/${callType.value}/${Uri.encode(callerAlias)}"
                    )
                }
            )
        }
        composable("rewards") {
            RewardsScreen(userId = userId, onBack = { navController.popBackStack() })
        }

        composable("earnings") {
            if (isHost) {
                val viewModel: HostWalletViewModel = hiltViewModel()
                EarningsScreen(viewModel) { navController.popBackStack() }
            } else {
                val viewModel: WalletViewModel = hiltViewModel(key = "home_wallet_user")
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
        composable("call/join/{callId}/{peerAlias}/{ratePerMinute}/{callType}/{peerAvatarSeed}") { backStackEntry ->
            val callId = Uri.decode(backStackEntry.arguments?.getString("callId") ?: return@composable)
            val peerAlias = Uri.decode(backStackEntry.arguments?.getString("peerAlias") ?: "Caller")
            val ratePerMinute = backStackEntry.arguments?.getString("ratePerMinute")?.toIntOrNull() ?: 5
            val callType = CallType.fromString(backStackEntry.arguments?.getString("callType") ?: "audio")
            val peerSeed = Uri.decode(backStackEntry.arguments?.getString("peerAvatarSeed") ?: peerAlias)
            val viewModel: CallViewModel = hiltViewModel()
            CallScreen(
                viewModel = viewModel,
                receiverId = "caller",
                otherUserAlias = peerAlias,
                otherUserAvatarSeed = peerSeed,
                ratePerMinute = ratePerMinute,
                callType = callType,
                existingCallId = callId,
                onEndCall = { sessionId ->
                    navController.navigate("host_home") {
                        popUpTo("host_home") { inclusive = false }
                    }
                }
            )
        }
        composable("waiting") {
            com.friendoo.app.presentation.call.WaitingScreen(
                onMatched = { hostUid, hostAlias, ratePerMinute, callType, hostAvatarSeed ->
                    navController.navigate(
                        "call/${Uri.encode(hostUid)}/${Uri.encode(hostAlias)}/$ratePerMinute/$callType/${Uri.encode(hostAvatarSeed)}"
                    ) {
                        popUpTo("waiting") { inclusive = true }
                    }
                },
                onCancel = {
                    navController.popBackStack()
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
