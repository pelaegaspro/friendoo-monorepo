package com.friendoo.app.presentation.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.friendoo.app.presentation.components.*
import com.friendoo.app.presentation.theme.*

@Composable
fun ProfileScreen(
    viewModel: ProfileViewModel,
    onLogoutSuccess: () -> Unit,
    onNavigateToRewards: () -> Unit = {},
    onNavigateToLeaderboard: () -> Unit = {},
    onNavigateToEarnings: () -> Unit = {}
) {
    val state by viewModel.state.collectAsState()

    Box(modifier = Modifier.fillMaxSize().background(WarmWhite)) {
        when (val currentState = state) {
            is ProfileState.Loading -> {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Coral)
                }
            }
            is ProfileState.Error -> {
                FriendooEmptyState(
                    title = "Couldn't load profile",
                    subtitle = currentState.message,
                    actionText = "Retry",
                    onAction = { viewModel.loadProfile() }
                )
            }
            is ProfileState.Success -> {
                val user = currentState.user
                val maskedPhone = if (user.phoneNumber.length >= 4) {
                    "+91 ${user.phoneNumber.take(2)}****${user.phoneNumber.takeLast(2)}"
                } else {
                    user.phoneNumber
                }

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                ) {
                    // Midnight gradient header
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(220.dp)
                            .background(Brush.verticalGradient(listOf(Midnight, MidnightDeep))),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            // Avatar with edit icon
                            Box {
                                FriendooAvatar(
                                    alias = user.alias,
                                    colorHex = user.avatarColor,
                                    size = 100.dp,
                                    fontSize = 36
                                )
                                // Edit icon
                                Box(
                                    modifier = Modifier
                                        .size(28.dp)
                                        .clip(CircleShape)
                                        .background(Coral)
                                        .align(Alignment.BottomEnd),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        Icons.Default.Edit,
                                        contentDescription = "Edit",
                                        tint = PureWhite,
                                        modifier = Modifier.size(14.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            Text(
                                text = user.alias,
                                style = MaterialTheme.typography.headlineSmall,
                                color = PureWhite,
                                fontWeight = FontWeight.Bold
                            )

                            Spacer(modifier = Modifier.height(4.dp))

                            // Level badge
                            Surface(
                                color = Coral.copy(alpha = 0.2f),
                                shape = PillShape
                            ) {
                                Text(
                                    "Host Level 3",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Coral,
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }

                    // Stats row
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp)
                            .offset(y = (-24).dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(modifier = Modifier.weight(1f)) { ProfileStatCard("Total Calls", "0", Icons.Default.Call) }
                        Box(modifier = Modifier.weight(1f)) { ProfileStatCard("Minutes", "48h", Icons.Default.DateRange) }
                        Box(modifier = Modifier.weight(1f)) { ProfileStatCard("Coins", "${user.coins}", Icons.Default.Star) }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Menu list
                    Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                        ProfileMenuItem(
                            icon = Icons.Default.Payment,
                            iconBg = Coral.copy(alpha = 0.1f),
                            iconTint = Coral,
                            label = "Earnings",
                            onClick = onNavigateToEarnings
                        )
                        ProfileMenuItem(
                            icon = Icons.Default.Star,
                            iconBg = SoftYellow.copy(alpha = 0.2f),
                            iconTint = WarningAmber,
                            label = "Rewards & Badges",
                            onClick = onNavigateToRewards
                        )
                        ProfileMenuItem(
                            icon = Icons.Default.People,
                            iconBg = InfoBlue.copy(alpha = 0.1f),
                            iconTint = InfoBlue,
                            label = "Leaderboard",
                            onClick = onNavigateToLeaderboard
                        )
                        ProfileMenuItem(
                            icon = Icons.Default.Settings,
                            iconBg = SurfaceElevated,
                            iconTint = WarmGray,
                            label = "Settings",
                            onClick = {}
                        )
                        ProfileMenuItem(
                            icon = Icons.Default.Info,
                            iconBg = SurfaceElevated,
                            iconTint = WarmGray,
                            label = "Help & Support",
                            onClick = {}
                        )
                        ProfileMenuItem(
                            icon = Icons.Default.Info,
                            iconBg = SurfaceElevated,
                            iconTint = WarmGray,
                            label = "Terms & Privacy",
                            onClick = {}
                        )
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    // Danger zone
                    FriendooCard(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp)
                    ) {
                        Column {
                            TextButton(
                                onClick = {
                                    viewModel.logout()
                                    onLogoutSuccess()
                                },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("Logout", color = ErrorRed, fontWeight = FontWeight.SemiBold)
                            }
                            Divider(color = BorderLight)
                            TextButton(
                                onClick = {},
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("Delete Account", color = ErrorRed.copy(alpha = 0.7f), style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    // App version
                    Text(
                        text = "v1.0.0",
                        style = MaterialTheme.typography.labelSmall,
                        color = LightGray,
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    )

                    Spacer(modifier = Modifier.height(32.dp))
                }
            }
        }
    }
}

@Composable
fun ProfileStatCard(label: String, value: String, icon: ImageVector) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = CardShape,
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(containerColor = PureWhite)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(icon, contentDescription = null, tint = Coral, modifier = Modifier.size(20.dp))
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = WarmGray
            )
        }
    }
}

@Composable
fun ProfileMenuItem(
    icon: ImageVector,
    iconBg: Color,
    iconTint: Color,
    label: String,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        shape = CardShape,
        color = PureWhite,
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderLight)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(iconBg),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.width(16.dp))
            Text(
                text = label,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.weight(1f)
            )
            Icon(
                Icons.Default.KeyboardArrowRight,
                contentDescription = null,
                tint = LightGray,
                modifier = Modifier.size(16.dp)
            )
        }
    }
}
