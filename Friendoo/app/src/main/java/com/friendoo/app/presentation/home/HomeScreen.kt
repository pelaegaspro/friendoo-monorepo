package com.friendoo.app.presentation.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Report
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.friendoo.app.core.model.CallType
import com.friendoo.app.data.model.Host
import com.friendoo.app.presentation.discover.DiscoverScreen
import com.friendoo.app.presentation.discover.DiscoverViewModel
import com.friendoo.app.presentation.profile.ProfileScreen
import com.friendoo.app.presentation.profile.ProfileViewModel
import com.friendoo.app.presentation.wallet.HostWalletViewModel
import com.friendoo.app.presentation.wallet.WalletScreen
import com.friendoo.app.presentation.wallet.WalletViewModel
import com.friendoo.app.presentation.theme.*

private data class BottomTab(
    val route: String,
    val label: String,
    val icon: ImageVector
)

private val ConnectoBlue = Color(0xFF4A7DF0)
private val ConnectoBgTop = Color(0xFFFFD6DA)
private val ConnectoBgBottom = Color(0xFFE4ECFF)
private val ConnectoText = Color(0xFF111111)
private val ConnectoMuted = Color(0xFF777777)
private val ConnectoCard = Color.White

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onHostClick: (Host, CallType) -> Unit,
    onLogoutSuccess: () -> Unit,
    onNavigateToRewards: () -> Unit,
    onNavigateToLeaderboard: () -> Unit,
    onNavigateToEarnings: () -> Unit = {},
    onNavigateToAvatarPicker: (String) -> Unit = {},
    onNavigateToWaiting: () -> Unit = {}
) {
    val tabs = listOf(
        BottomTab("discover", "Home", Icons.Filled.Home),
        BottomTab("history", "Recents", Icons.Filled.History),
        BottomTab("wallet", "Wallet", Icons.Filled.AccountBalanceWallet),
        BottomTab("profile", "Profile", Icons.Filled.Person)
    )

    var selectedTab by rememberSaveable { mutableStateOf("discover") }

    Scaffold(
        containerColor = Color.Transparent,
        bottomBar = {
            Surface(
                color = Color(0xFFFFF0FA),
                tonalElevation = 0.dp,
                shadowElevation = 8.dp,
                shape = RoundedCornerShape(topStart = 26.dp, topEnd = 26.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(78.dp)
                        .padding(horizontal = 12.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    tabs.forEach { tab ->
                        val isSelected = selectedTab == tab.route

                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center,
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight()
                                .clip(RoundedCornerShape(16.dp))
                                .clickable { selectedTab = tab.route }
                                .padding(vertical = 6.dp)
                        ) {
                            Icon(
                                tab.icon,
                                contentDescription = tab.label,
                                tint = if (isSelected) ConnectoBlue else Color(0xFF333333),
                                modifier = Modifier.size(if (isSelected) 30.dp else 27.dp)
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = tab.label,
                                fontSize = 14.sp,
                                color = if (isSelected) ConnectoBlue else Color(0xFF333333),
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                            )
                        }
                    }
                }
            }
        }
    ) { padding ->
        Box(modifier = Modifier
            .padding(padding)
            .background(Brush.verticalGradient(listOf(ConnectoBgTop, ConnectoBgBottom)))
            .fillMaxSize()
        ) {
            key(selectedTab) {
                when (selectedTab) {
                    "discover" -> {
                        val viewModel: DiscoverViewModel = hiltViewModel(key = "home_discover")
                        DiscoverScreen(
                            viewModel = viewModel,
                            onHostClick = onHostClick,
                            onQuickMatch = onNavigateToWaiting,
                            onWalletClick = { selectedTab = "wallet" }
                        )
                    }
                    "history" -> {
                        UserCallHistoryScreen()
                    }
                    "wallet" -> {
                        val walletViewModel: WalletViewModel = hiltViewModel(key = "home_wallet_user")
                        val hostWalletViewModel: HostWalletViewModel = hiltViewModel(key = "home_wallet_host")
                        WalletScreen(walletViewModel, hostWalletViewModel, onNavigateToEarnings = onNavigateToEarnings)
                    }
                    "profile" -> {
                        val profileViewModel: ProfileViewModel = hiltViewModel(key = "home_profile")
                        ProfileScreen(
                            viewModel = profileViewModel,
                            onLogoutSuccess = onLogoutSuccess,
                            onNavigateToRewards = onNavigateToRewards,
                            onNavigateToLeaderboard = onNavigateToLeaderboard,
                            onNavigateToRecents = { selectedTab = "history" },
                            onNavigateToEarnings = onNavigateToEarnings,
                            onNavigateToAvatarPicker = onNavigateToAvatarPicker
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun UserCallHistoryScreen() {
    var onlineOnly by remember { mutableStateOf(true) }
    var showActions by remember { mutableStateOf(false) }
    val callList = remember {
        mutableStateOf(listOf(
        UserCallItem("Rashmi", "0m 21s • 12:38 am", "Active 1 hours ago", "offline"),
        UserCallItem("Srikutty", "0m 16s • 12:35 am", "Active 8 hours ago", "offline"),
        UserCallItem("jasmine", "0m 33s • 12:34 am", "Busy", "busy"),
        UserCallItem("love", "0m 4s • 12:33 am", "Active 2 days ago", "offline"),
        UserCallItem("MABARO", "0m 14s • 12:32 am", "Active 18 minutes ago", "offline"),
        UserCallItem("( @yalini )", "0m 7s • 12:30 am", "Active 2 hours ago", "offline"),
        UserCallItem("sanju", "0m 11s • 12:29 am", "Active 9 hours ago", "offline")
        ))
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(ConnectoBgTop, ConnectoBgBottom)))
            .padding(horizontal = 16.dp)
            .padding(top = 28.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.ArrowBack, contentDescription = null, tint = Color.Black, modifier = Modifier.size(26.dp))
            Spacer(modifier = Modifier.width(10.dp))
            Text(
                text = "Recents",
                color = Color.Black,
                fontSize = 24.sp,
                fontWeight = FontWeight.ExtraBold,
                modifier = Modifier.weight(1f)
            )
            Text("Online", color = ConnectoBlue, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.width(8.dp))
            Switch(
                checked = onlineOnly,
                onCheckedChange = { onlineOnly = it },
                colors = SwitchDefaults.colors(
                    checkedThumbColor = ConnectoBlue,
                    checkedTrackColor = ConnectoBlue.copy(alpha = 0.18f),
                    uncheckedThumbColor = Color.White,
                    uncheckedTrackColor = Color.White.copy(alpha = 0.7f)
                )
            )
            Box {
                IconButton(onClick = { showActions = true }) {
                Icon(Icons.Default.MoreVert, contentDescription = "More", tint = Color.Black, modifier = Modifier.size(24.dp))
                }
                DropdownMenu(
                    expanded = showActions,
                    onDismissRequest = { showActions = false }
                ) {
                    DropdownMenuItem(
                        text = { Text("Delete call logs") },
                        leadingIcon = {
                            Icon(Icons.Default.Delete, contentDescription = null, tint = Color(0xFFE84B5F))
                        },
                        onClick = {
                            callList.value = emptyList()
                            showActions = false
                        }
                    )
                }
            }
        }

        Text("Apr 16, 2026", color = ConnectoText, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
        Spacer(modifier = Modifier.height(10.dp))

        androidx.compose.foundation.lazy.LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(bottom = 18.dp)
        ) {
            items(callList.value) { call ->
                RecentCallCard(call)
            }
            if (callList.value.isEmpty()) {
                item {
                    Text(
                        text = "No recent call logs",
                        color = ConnectoMuted,
                        fontSize = 14.sp,
                        modifier = Modifier.padding(top = 24.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun RecentCallCard(call: UserCallItem) {
    val statusColor = when (call.status) {
        "busy" -> Color(0xFFFFBE28)
        "online" -> Color(0xFF27C044)
        else -> Color(0xFFB8B8B8)
    }
    val callEnabled = call.status == "busy" || call.status == "online"

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = ConnectoCard
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(modifier = Modifier.size(58.dp)) {
                Box(
                    modifier = Modifier
                        .size(46.dp)
                        .align(Alignment.TopCenter)
                        .clip(CircleShape)
                        .background(Color(0xFFE6E6E6)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(call.hostAlias.take(1), color = ConnectoBlue, fontWeight = FontWeight.ExtraBold, fontSize = 19.sp)
                }
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .align(Alignment.TopEnd)
                        .clip(CircleShape)
                        .background(statusColor)
                )
                Surface(
                    modifier = Modifier.align(Alignment.BottomCenter),
                    shape = RoundedCornerShape(50),
                    color = Color.White,
                    border = androidx.compose.foundation.BorderStroke(1.dp, statusColor)
                ) {
                    Text(
                        text = if (call.status == "busy") "Busy" else "Offline",
                        color = statusColor,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 1.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(call.hostAlias, color = Color.Black, fontSize = 16.sp, fontWeight = FontWeight.ExtraBold)
                Spacer(modifier = Modifier.height(2.dp))
                Text(call.timestamp, color = Color(0xFF555555), fontSize = 12.sp)
                Spacer(modifier = Modifier.height(2.dp))
                Text(call.subtitle, color = ConnectoMuted, fontSize = 12.sp)
            }

            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(if (callEnabled) ConnectoBlue else Color(0xFFBDBDBD)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Call, contentDescription = "Call", tint = Color.White, modifier = Modifier.size(21.dp))
            }
            Spacer(modifier = Modifier.width(8.dp))
            Surface(
                shape = CircleShape,
                color = Color(0xFFFFEEF2),
                modifier = Modifier.size(36.dp)
            ) {
                Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                    Icon(
                        Icons.Default.Report,
                        contentDescription = "Report user",
                        tint = Color(0xFFE84B5F),
                        modifier = Modifier.size(19.dp)
                    )
                }
            }
        }
    }
}

private data class UserCallItem(
    val hostAlias: String,
    val timestamp: String,
    val subtitle: String,
    val status: String
)
