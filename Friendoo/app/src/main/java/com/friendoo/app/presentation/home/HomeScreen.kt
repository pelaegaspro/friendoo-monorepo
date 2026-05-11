package com.friendoo.app.presentation.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.friendoo.app.data.model.Host
import com.friendoo.app.presentation.chat.ChatListScreen
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onHostClick: (Host) -> Unit,
    onChatClick: (String, String) -> Unit,
    onLogoutSuccess: () -> Unit,
    onNavigateToRewards: () -> Unit,
    onNavigateToLeaderboard: () -> Unit,
    onNavigateToEarnings: () -> Unit = {}
) {
    val tabs = listOf(
        BottomTab("discover", "Discover", Icons.Filled.Search),
        BottomTab("chats", "Chats", Icons.Filled.Email),
        BottomTab("wallet", "Wallet", Icons.Filled.Star),
        BottomTab("profile", "Profile", Icons.Filled.Person)
    )

    var selectedTab by rememberSaveable { mutableStateOf("discover") }

    Scaffold(
        bottomBar = {
            Surface(
                color = PureWhite,
                tonalElevation = 0.dp,
                shadowElevation = 4.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(64.dp)
                        .padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    tabs.forEach { tab ->
                        val isSelected = selectedTab == tab.route
                        val iconColor = if (isSelected) Coral else WarmGray
                        val textColor = if (isSelected) Coral else WarmGray

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
                            if (isSelected) {
                                Box(
                                    modifier = Modifier
                                        .size(40.dp)
                                        .clip(CircleShape)
                                        .background(Coral.copy(alpha = 0.1f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        tab.icon,
                                        contentDescription = tab.label,
                                        tint = Coral,
                                        modifier = Modifier.size(22.dp)
                                    )
                                }
                            } else {
                                Icon(
                                    tab.icon,
                                    contentDescription = tab.label,
                                    tint = WarmGray,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = tab.label,
                                style = MaterialTheme.typography.labelSmall,
                                color = textColor,
                                fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal
                            )
                        }
                    }
                }
            }
        }
    ) { padding ->
        Box(modifier = Modifier
            .padding(padding)
            .background(WarmWhite)
            .fillMaxSize()
        ) {
            when (selectedTab) {
                "discover" -> {
                    val viewModel: DiscoverViewModel = hiltViewModel()
                    DiscoverScreen(viewModel, onHostClick)
                }
                "chats" -> {
                    ChatListScreen(onChatClick)
                }
                "wallet" -> {
                    val walletViewModel: WalletViewModel = hiltViewModel()
                    val hostWalletViewModel: HostWalletViewModel = hiltViewModel()
                    val profileViewModel: ProfileViewModel = hiltViewModel()
                    WalletScreen(walletViewModel, hostWalletViewModel, profileViewModel.userPreferences)
                }
                "profile" -> {
                    val profileViewModel: ProfileViewModel = hiltViewModel()
                    ProfileScreen(
                        viewModel = profileViewModel,
                        onLogoutSuccess = onLogoutSuccess,
                        onNavigateToRewards = onNavigateToRewards,
                        onNavigateToLeaderboard = onNavigateToLeaderboard,
                        onNavigateToEarnings = onNavigateToEarnings
                    )
                }
            }
        }
    }
}
