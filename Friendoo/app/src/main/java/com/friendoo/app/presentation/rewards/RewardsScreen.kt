package com.friendoo.app.presentation.rewards

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RewardsScreen(onBack: () -> Unit) {
    var userData by remember { mutableStateOf<Map<String, Any>?>(null) }
    var hostData by remember { mutableStateOf<Map<String, Any>?>(null) }
    val userId = FirebaseAuth.getInstance().currentUser?.uid
    val db = FirebaseFirestore.getInstance()

    LaunchedEffect(userId) {
        if (userId != null) {
            db.collection("users").doc(userId).get().addOnSuccessListener { userData = it.data() }
            db.collection("hosts").doc(userId).get().addOnSuccessListener { hostData = it.data() }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Rewards & Milestones", fontWeight = FontWeight.Black) },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, contentDescription = null) }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // User Section (Always visible for balance)
            item {
                UserRewardsCard(
                    freeMins = (userData?.get("freeMinutes") as? Long)?.toInt() ?: 0,
                    totalSpent = (userData?.get("totalSpent") as? Number)?.toDouble() ?: 0.0,
                    milestones = (userData?.get("milestones") as? List<String>) ?: emptyList()
                )
            }

            // Host Section (Only if user is a host)
            if (hostData != null) {
                item {
                    HostIncentiveCard(
                        totalCalls = (hostData?.get("totalCalls") as? Long)?.toInt() ?: 0,
                        badges = (hostData?.get("badges") as? List<String>) ?: emptyList(),
                        isStarHost = hostData?.get("isStarHost") as? Boolean ?: false,
                        starRank = (hostData?.get("starRank") as? Long)?.toInt() ?: 0
                    )
                }
            }
        }
    }
}

@Composable
fun UserRewardsCard(freeMins: Int, totalSpent: Double, milestones: List<String>) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
    ) {
        Column(modifier = Modifier.padding(24.dp)) {
            Text("Free Minutes Balance", style = MaterialTheme.typography.labelMedium)
            Text(
                "$freeMins MINS",
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Black,
                color = MaterialTheme.colorScheme.primary
            )
            
            Spacer(Modifier.height(24.dp))
            
            Text("Next Milestone", fontWeight = FontWeight.Bold)
            val nextGoal = when {
                totalSpent < 100 -> 100.0
                totalSpent < 500 -> 500.0
                else -> 1000.0
            }
            val progress = (totalSpent / nextGoal).toFloat().coerceIn(0f, 1f)
            
            LinearProgressIndicator(
                progress = progress,
                modifier = Modifier.fillMaxWidth().height(8.dp).clip(CircleShape),
                color = MaterialTheme.colorScheme.primary,
                trackColor = Color.White.copy(alpha = 0.2f)
            )
            Text(
                "Spend ₹${(nextGoal - totalSpent).toInt()} more to unlock free minutes",
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(top = 8.dp)
            )

            if (milestones.isNotEmpty()) {
                Spacer(Modifier.height(24.dp))
                Text("Unlocked Badges", style = MaterialTheme.typography.labelSmall)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 8.dp)) {
                    milestones.forEach { badge ->
                        BadgeChip(badge, Color.Cyan)
                    }
                }
            }
        }
    }
}

@Composable
fun HostIncentiveCard(totalCalls: Int, badges: List<String>, isStarHost: Boolean, starRank: Int) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E1E))
    ) {
        Column(modifier = Modifier.padding(24.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.TrendingUp, contentDescription = null, tint = Color.Green)
                Spacer(Modifier.width(8.dp))
                Text("Host Growth", fontWeight = FontWeight.Bold, color = Color.White)
            }

            if (isStarHost) {
                Spacer(Modifier.height(16.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            brush = Brush.horizontalGradient(listOf(Color(0xFFFFD700), Color(0xFFFFA500))),
                            shape = RoundedCornerShape(12.dp)
                        )
                        .padding(16.dp)
                ) {
                    Text("🌟 Current Rank: STAR #$starRank", color = Color.Black, fontWeight = FontWeight.Black)
                }
            }

            Spacer(Modifier.height(24.dp))
            Text("Total Calls Completed: $totalCalls", color = Color.Gray)
            
            val nextGoal = when {
                totalCalls < 10 -> 10
                totalCalls < 50 -> 50
                totalCalls < 100 -> 100
                else -> 500
            }
            LinearProgressIndicator(
                progress = (totalCalls.toFloat() / nextGoal).coerceIn(0f, 1f),
                modifier = Modifier.fillMaxWidth().height(8.dp).clip(CircleShape).padding(vertical = 8.dp),
                color = Color(0xFFFFD700)
            )
            Text("${nextGoal - totalCalls} calls left for next bonus", style = MaterialTheme.typography.bodySmall, color = Color.Gray)

            if (badges.isNotEmpty()) {
                Spacer(Modifier.height(16.dp))
                FlowRow(mainAxisSpacing = 8.dp, crossAxisSpacing = 8.dp) {
                    badges.forEach { badge ->
                        BadgeChip(badge, Color(0xFFFFD700))
                    }
                }
            }
        }
    }
}

@Composable
fun BadgeChip(label: String, color: Color) {
    Surface(
        color = color.copy(alpha = 0.1f),
        shape = RoundedCornerShape(8.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, color.copy(alpha = 0.5f))
    ) {
        Text(
            label,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            color = color
        )
    }
}

@Composable
fun FlowRow(
    mainAxisSpacing: androidx.compose.ui.unit.Dp,
    crossAxisSpacing: androidx.compose.ui.unit.Dp,
    content: @Composable () -> Unit
) {
    androidx.compose.ui.layout.Layout(content) { measurables, constraints ->
        val placeables = measurables.map { it.measure(constraints) }
        var y = 0
        var x = 0
        var maxY = 0
        layout(constraints.maxWidth, constraints.maxHeight) {
            placeables.forEach { placeable ->
                if (x + placeable.width > constraints.maxWidth) {
                    x = 0
                    y += maxY + crossAxisSpacing.roundToPx()
                    maxY = 0
                }
                placeable.placeRelative(x, y)
                x += placeable.width + mainAxisSpacing.roundToPx()
                maxY = maxOf(maxY, placeable.height)
            }
        }
    }
}
