package com.friendoo.app.presentation.host

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.key
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.hilt.navigation.compose.hiltViewModel
import com.friendoo.app.presentation.profile.ProfileScreen
import com.friendoo.app.presentation.wallet.EarningsScreen
import com.friendoo.app.core.model.CallType
import com.friendoo.app.presentation.call.IncomingRequestDialog
import com.friendoo.app.presentation.profile.ProfileViewModel
import com.friendoo.app.presentation.theme.*

@Composable
fun HostHomeScreen(
    onLogoutSuccess: () -> Unit,
    onNavigateToSettings: () -> Unit,
    onNavigateToPerformance: () -> Unit,
    onJoinIncomingCall: (callId: String, callerAlias: String, ratePerMinute: Int, callType: CallType) -> Unit
) {
    var selectedItem by remember { mutableIntStateOf(0) }
    val items = listOf(
        NavigationItem("Home", Icons.Outlined.Dashboard, Icons.Filled.Dashboard),
        NavigationItem("History", Icons.Outlined.History, Icons.Filled.History),
        NavigationItem("Earnings", Icons.Outlined.TrendingUp, Icons.Filled.TrendingUp),
        NavigationItem("Profile", Icons.Outlined.Person, Icons.Filled.Person)
    )

    Scaffold(
        bottomBar = {
            Column {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(1.dp)
                        .background(
                            Brush.horizontalGradient(
                                listOf(
                                    Color.Transparent,
                                    BorderLight.copy(alpha = 0.5f),
                                    Color.Transparent
                                )
                            )
                        )
                )
                NavigationBar(
                    containerColor = Midnight,
                    tonalElevation = 0.dp,
                    modifier = Modifier.height(72.dp)
                ) {
                    items.forEachIndexed { index, item ->
                        val isSelected = selectedItem == index
                        NavigationBarItem(
                            icon = {
                                if (isSelected) {
                                    Box(
                                        modifier = Modifier
                                            .size(36.dp)
                                            .clip(CircleShape)
                                            .background(SuccessGreen.copy(alpha = 0.15f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            item.selectedIcon,
                                            contentDescription = item.label,
                                            tint = SuccessGreen,
                                            modifier = Modifier.size(22.dp)
                                        )
                                    }
                                } else {
                                    Icon(
                                        item.icon,
                                        contentDescription = item.label,
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                            },
                            label = {
                                Text(
                                    item.label,
                                    fontSize = 11.sp,
                                    fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                                    color = if (isSelected) SuccessGreen else WarmGray
                                )
                            },
                            selected = isSelected,
                            onClick = { selectedItem = index },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = SuccessGreen,
                                selectedTextColor = SuccessGreen,
                                unselectedIconColor = WarmGray,
                                unselectedTextColor = WarmGray,
                                indicatorColor = Color.Transparent
                            )
                        )
                    }
                }
            }
        },
        containerColor = Midnight
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            key(selectedItem) {
                when (selectedItem) {
                    0 -> HostDashboardScreen(
                        onNavigateToEarnings = { selectedItem = 2 },
                        onNavigateToHistory = { selectedItem = 1 },
                        onNavigateToPerformance = onNavigateToPerformance,
                        onNavigateToSettings = onNavigateToSettings,
                        onNavigateToProfile = { selectedItem = 3 },
                        onJoinIncomingCall = onJoinIncomingCall
                    )
                    1 -> CallHistoryScreen(onBack = { selectedItem = 0 })
                    2 -> EarningsScreen(onBack = { selectedItem = 0 })
                    3 -> ProfileScreen(
                        viewModel = hiltViewModel(key = "host_profile"),
                        onLogoutSuccess = onLogoutSuccess,
                        onNavigateToEarnings = { selectedItem = 2 }
                    )
                }
            }
        }
    }
}

@Composable
private fun HostDashboardScreen(
    onNavigateToEarnings: () -> Unit,
    onNavigateToHistory: () -> Unit,
    onNavigateToPerformance: () -> Unit,
    onNavigateToSettings: () -> Unit,
    onNavigateToProfile: () -> Unit,
    onJoinIncomingCall: (callId: String, callerAlias: String, ratePerMinute: Int, callType: CallType) -> Unit,
    viewModel: HostDashboardViewModel = hiltViewModel(),
    incomingCallViewModel: IncomingCallViewModel = hiltViewModel()
) {
    val isOnline by viewModel.isOnline.collectAsState()
    val incoming by incomingCallViewModel.incoming.collectAsState()
    val isAccepting by incomingCallViewModel.isAccepting.collectAsState()
    val incomingAction by incomingCallViewModel.action.collectAsState()

    LaunchedEffect(isOnline) {
        if (isOnline) incomingCallViewModel.startListening() else incomingCallViewModel.stopListening()
    }

    LaunchedEffect(incomingAction) {
        when (val action = incomingAction) {
            is IncomingCallAction.Join -> {
                onJoinIncomingCall(
                    action.result.callId,
                    action.callerAlias,
                    action.ratePerMinute,
                    action.callType
                )
                incomingCallViewModel.clearAction()
            }
            is IncomingCallAction.Dismissed -> incomingCallViewModel.clearAction()
            null -> Unit
        }
    }

    incoming?.let { offer ->
        IncomingRequestDialog(
            callId = offer.callId,
            callerAlias = offer.callerAlias,
            ratePerMinute = offer.ratePerMinute,
            callTypeLabel = if (offer.callType == CallType.VIDEO) "video" else "audio",
            secondsLeft = offer.secondsLeft,
            isSubmitting = isAccepting,
            onAccept = { incomingCallViewModel.acceptIncoming() },
            onDecline = { incomingCallViewModel.declineIncoming() }
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Midnight)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // Top status card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            colors = CardDefaults.cardColors(containerColor = MidnightSurface),
            shape = RoundedCornerShape(16.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Work Mode",
                        color = PureWhite,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = if (isOnline) "You are receiving calls" else "Offline",
                        color = if (isOnline) SuccessGreen else WarmGray,
                        fontSize = 14.sp
                    )
                }
                Switch(
                    checked = isOnline,
                    onCheckedChange = { viewModel.toggleWorkMode(it) },
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = PureWhite,
                        checkedTrackColor = SuccessGreen,
                        uncheckedThumbColor = LightGray,
                        uncheckedTrackColor = Midnight
                    )
                )
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))

        // Quick Stats Row
        Text(
            text = "Today's Stats",
            color = PureWhite,
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatCard(
                title = "Earnings",
                value = "₹ 480",
                icon = Icons.Default.TrendingUp,
                color = SuccessGreen,
                modifier = Modifier.weight(1f),
                onClick = onNavigateToEarnings
            )
            StatCard(
                title = "Total Calls",
                value = "12 calls",
                icon = Icons.Default.Phone,
                color = Teal,
                modifier = Modifier.weight(1f),
                onClick = onNavigateToHistory
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatCard(
                title = "Talk Time",
                value = "64 mins",
                icon = Icons.Default.Call,
                color = Coral,
                modifier = Modifier.weight(1f),
                onClick = onNavigateToPerformance
            )
            StatCard(
                title = "Call Rate",
                value = "8 coins/min",
                icon = Icons.Default.Star,
                color = SoftYellow,
                modifier = Modifier.weight(1f),
                onClick = onNavigateToProfile
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Quick Actions
        Text(
            text = "Quick Actions",
            color = PureWhite,
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        ActionRow(
            label = "Settings",
            icon = Icons.Default.Settings,
            color = LightGray,
            onClick = onNavigateToSettings
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun StatCard(
    title: String,
    value: String,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MidnightSurface),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                tint = color,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(text = title, color = WarmGray, fontSize = 12.sp)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                color = PureWhite,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ActionRow(
    label: String,
    icon: ImageVector,
    color: Color,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        colors = CardDefaults.cardColors(containerColor = MidnightSurface),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = icon,
                    contentDescription = label,
                    tint = color,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(text = label, color = PureWhite, fontSize = 14.sp, fontWeight = FontWeight.Medium)
            }
            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = "Go",
                tint = WarmGray,
                modifier = Modifier.size(16.dp)
            )
        }
    }
}

@Composable
private fun CallHistoryScreen(onBack: () -> Unit) {
    // Beautiful mock list of incoming calls
    val callList = listOf(
        CallItem("Anonymous Tiger", "Today, 4:32 PM", "12m 45s", "+102 coins", "video"),
        CallItem("Anonymous Dolphin", "Today, 1:15 PM", "5m 12s", "+41 coins", "audio"),
        CallItem("Anonymous Koala", "Yesterday, 8:45 PM", "24m 10s", "+193 coins", "video"),
        CallItem("Anonymous Fox", "Yesterday, 3:20 PM", "8m 05s", "+64 coins", "audio"),
        CallItem("Anonymous Owl", "15 May, 10:12 AM", "15m 30s", "+124 coins", "audio")
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Midnight)
    ) {
        // Simple Top bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = PureWhite)
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Call History",
                color = PureWhite,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
        }

        if (callList.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text(text = "No calls yet", color = WarmGray, fontSize = 16.sp)
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(callList) { call ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MidnightSurface),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                val isVideo = call.callType == "video"
                                val iconBg = if (isVideo) Coral.copy(alpha = 0.15f) else Teal.copy(alpha = 0.15f)
                                val iconTint = if (isVideo) Coral else Teal
                                val icon = if (isVideo) Icons.Default.Videocam else Icons.Default.Call

                                Box(
                                    modifier = Modifier
                                        .size(40.dp)
                                        .clip(CircleShape)
                                        .background(iconBg),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = icon,
                                        contentDescription = if (isVideo) "Video Call" else "Audio Call",
                                        tint = iconTint,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            text = call.callerAlias,
                                            color = PureWhite,
                                            fontSize = 15.sp,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Surface(
                                            shape = RoundedCornerShape(4.dp),
                                            color = iconBg
                                        ) {
                                            Text(
                                                text = if (isVideo) "Video" else "Audio",
                                                color = iconTint,
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = call.timestamp,
                                        color = WarmGray,
                                        fontSize = 12.sp
                                    )
                                }
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    text = call.duration,
                                    color = PureWhite,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Medium
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = call.coinsEarned,
                                    color = SuccessGreen,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

private data class CallItem(
    val callerAlias: String,
    val timestamp: String,
    val duration: String,
    val coinsEarned: String,
    val callType: String = "audio" // "audio" or "video"
)

private data class NavigationItem(
    val label: String,
    val icon: ImageVector,
    val selectedIcon: ImageVector = icon
)
