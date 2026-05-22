package com.friendoo.app.presentation.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.CompareArrows
import androidx.compose.material.icons.filled.ContactMail
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.friendoo.app.data.model.User
import com.friendoo.app.presentation.components.FriendooAvatar
import com.friendoo.app.presentation.components.FriendooEmptyState

private val ConnectoBlue = Color(0xFF4A7DF0)
private val ConnectoGreen = Color(0xFF27C044)
private val ConnectoText = Color(0xFF111111)
private val ConnectoMuted = Color(0xFF777777)
private val ConnectoBgTop = Color(0xFFFFD6DA)
private val ConnectoBgBottom = Color(0xFFE4ECFF)
private val ConnectoCard = Color.White
private val ConnectoCardShape = RoundedCornerShape(24.dp)
private val Rupee = "\u20B9"

@Composable
fun ProfileScreen(
    viewModel: ProfileViewModel,
    onLogoutSuccess: () -> Unit,
    onNavigateToRewards: () -> Unit = {},
    onNavigateToRecents: () -> Unit = {},
    onNavigateToEarnings: () -> Unit = {},
    onNavigateToAvatarPicker: (String) -> Unit = {}
) {
    val state by viewModel.state.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(ConnectoBgTop, ConnectoBgBottom)))
    ) {
        when (val currentState = state) {
            is ProfileState.Loading -> {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = ConnectoBlue)
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
                ProfileContent(
                    user = currentState.user,
                    onEditProfile = { onNavigateToAvatarPicker(currentState.user.avatarSeed.ifBlank { currentState.user.uid }) },
                    onRewards = onNavigateToRewards,
                    onRecents = onNavigateToRecents,
                    onEarnings = onNavigateToEarnings,
                    onLogout = {
                        viewModel.logout()
                        onLogoutSuccess()
                    }
                )
            }
        }
    }
}

@Composable
private fun ProfileContent(
    user: User,
    onEditProfile: () -> Unit,
    onRewards: () -> Unit,
    onRecents: () -> Unit,
    onEarnings: () -> Unit,
    onLogout: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp)
            .padding(top = 26.dp, bottom = 42.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        ProfileTopBar(coins = user.coins)
        ProfileHeroCard(user = user, onEditProfile = onEditProfile, onAddBalance = onEarnings)

        ProfileMenuRow(Icons.Default.History, "Recents", ConnectoBlue, onClick = onRecents)
        ProfileMenuRow(Icons.Default.CompareArrows, "Transactions", ConnectoBlue, onClick = onEarnings)
        ProfileMenuRow(Icons.Default.Language, "Change Language", ConnectoBlue, trailingText = "Tamil", onClick = {})
        ProfileMenuRow(Icons.Default.Star, "Love friendoo? Rate us", Color(0xFFFFBE28), onClick = onRewards)
        ProfileMenuRow(Icons.Default.Share, "Share App", ConnectoBlue, onClick = {})
        ProfileMenuRow(Icons.Default.ContactMail, "Contact Us", ConnectoBlue, onClick = {})
        ProfileMenuRow(Icons.Default.Logout, "Logout", Color(0xFFE84B5F), onClick = onLogout)

        Spacer(modifier = Modifier.height(40.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.Shield, contentDescription = null, tint = ConnectoGreen, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text("100% Safe and Private", color = ConnectoGreen, fontSize = 13.sp)
        }
    }
}

@Composable
private fun ProfileTopBar(coins: Int) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(Icons.Default.ArrowBack, contentDescription = null, tint = Color.Black, modifier = Modifier.size(34.dp))
        Spacer(modifier = Modifier.width(10.dp))
        Text(
            "My Profile",
            color = Color.Black,
            fontWeight = FontWeight.ExtraBold,
            fontSize = 22.sp,
            modifier = Modifier.weight(1f)
        )
        BalancePill(coins)
        IconButton(onClick = {}) {
            Icon(Icons.Default.Settings, contentDescription = "Settings", tint = Color.Black, modifier = Modifier.size(34.dp))
        }
    }
}

@Composable
private fun BalancePill(coins: Int) {
    Surface(
        shape = RoundedCornerShape(50),
        color = ConnectoBlue
    ) {
        Row(
            modifier = Modifier.padding(start = 12.dp, end = 6.dp, top = 6.dp, bottom = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("$Rupee${coins}.00", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
            Spacer(modifier = Modifier.width(6.dp))
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .background(Color.White, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Add, contentDescription = null, tint = ConnectoBlue, modifier = Modifier.size(18.dp))
            }
        }
    }
}

@Composable
private fun ProfileHeroCard(
    user: User,
    onEditProfile: () -> Unit,
    onAddBalance: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = ConnectoCardShape,
        color = ConnectoCard
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 24.dp, vertical = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            FriendooAvatar(
                avatarSeed = user.avatarSeed.ifBlank { user.uid },
                avatarUrl = user.avatarUrl,
                size = 100.dp
            )
            Spacer(modifier = Modifier.height(14.dp))
            Text(
                user.alias.ifBlank { user.displayName.ifBlank { "Friendoo User" } },
                color = Color(0xFF333333),
                fontWeight = FontWeight.ExtraBold,
                fontSize = 19.sp
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "Member since ${user.createdAt.ifBlank { "24 February, 2026" }}",
                color = ConnectoMuted,
                fontSize = 13.sp,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(22.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                Button(
                    onClick = onEditProfile,
                    modifier = Modifier
                        .weight(1f)
                        .height(44.dp),
                    shape = RoundedCornerShape(50),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.White,
                        contentColor = ConnectoText
                    ),
                    border = androidx.compose.foundation.BorderStroke(1.4.dp, ConnectoText.copy(alpha = 0.75f))
                ) {
                    Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Edit Profile", fontSize = 14.sp)
                }
                Button(
                    onClick = onAddBalance,
                    modifier = Modifier
                        .weight(1f)
                        .height(44.dp),
                    shape = RoundedCornerShape(50),
                    colors = ButtonDefaults.buttonColors(containerColor = ConnectoBlue)
                ) {
                    Text("Add Balance", color = Color.White, fontSize = 14.sp)
                }
            }
        }
    }
}

@Composable
private fun ProfileMenuRow(
    icon: ImageVector,
    label: String,
    iconTint: Color,
    trailingText: String? = null,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = ConnectoCardShape,
        color = ConnectoCard
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(24.dp))
            Spacer(modifier = Modifier.width(18.dp))
            Text(
                label,
                color = Color.Black,
                fontWeight = FontWeight.ExtraBold,
                fontSize = 15.sp,
                modifier = Modifier.weight(1f)
            )
            if (trailingText != null) {
                Text(trailingText, color = ConnectoBlue, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            } else {
                Icon(Icons.Default.ArrowForward, contentDescription = null, tint = ConnectoMuted, modifier = Modifier.size(20.dp))
            }
        }
    }
}
