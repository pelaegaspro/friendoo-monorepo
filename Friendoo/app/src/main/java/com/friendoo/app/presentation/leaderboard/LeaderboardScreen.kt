package com.friendoo.app.presentation.leaderboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.friendoo.app.presentation.components.FriendooAvatar
import com.friendoo.app.presentation.theme.LocalFriendooColors
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.tasks.await

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LeaderboardScreen(
    onBack: (() -> Unit)? = null
) {
    var tabIndex by remember { mutableStateOf(0) } // 0 = Star Hosts, 1 = Top Givers
    var selectedLanguage by remember { mutableStateOf("Hindi") }
    val languages = listOf("Hindi", "English", "Tamil", "Telugu", "Bengali")

    var starHosts by remember { mutableStateOf<List<Map<String, Any>>>(emptyList()) }
    var topGivers by remember { mutableStateOf<List<Map<String, Any>>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(tabIndex, selectedLanguage) {
        isLoading = true
        try {
            val db = FirebaseFirestore.getInstance()
            if (tabIndex == 0) {
                val snap = db.collection("hosts")
                    .whereEqualTo("isStarHost", true)
                    .whereEqualTo("starLanguage", selectedLanguage)
                    .orderBy("starRank", Query.Direction.ASCENDING)
                    .limit(10)
                    .get()
                    .await()

                starHosts = snap.documents.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    (data as Map<String, Any>) + ("id" to doc.id)
                }
            } else {
                // Fetch top users by coins descending from firestore, filter non-hosts in memory to avoid composite index requirements
                val snap = db.collection("users")
                    .whereEqualTo("isHost", false)
                    .orderBy("coins", Query.Direction.DESCENDING)
                    .limit(10)
                    .get()
                    .await()

                val filtered = snap.documents.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    val coinsValue = (data["coins"] as? Number)?.toInt() ?: 0
                    mapOf(
                        "uid" to doc.id,
                        "alias" to (data["alias"] as? String ?: data["displayName"] as? String ?: "Anonymous User"),
                        "avatarSeed" to (data["avatarSeed"] as? String ?: doc.id),
                        "coins" to coinsValue
                    )
                }

                topGivers = filtered.mapIndexed { index, map ->
                    map + ("rank" to (index + 1))
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("LEADERBOARD_DEBUG", "Failed to fetch leaderboard", e)
            if (tabIndex == 0) starHosts = emptyList() else topGivers = emptyList()
        }
        isLoading = false
    }

    val friendooColors = LocalFriendooColors.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Leaderboard", fontWeight = FontWeight.Bold, color = friendooColors.textPrimary) },
                navigationIcon = {
                    if (onBack != null) {
                        IconButton(onClick = onBack) {
                            Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = friendooColors.textPrimary)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            // Dual Tab Row
            val tabs = listOf("Star Hosts", "Top Givers")
            TabRow(
                selectedTabIndex = tabIndex,
                containerColor = MaterialTheme.colorScheme.background,
                contentColor = MaterialTheme.colorScheme.primary
            ) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = tabIndex == index,
                        onClick = { tabIndex = index },
                        text = { Text(title, fontWeight = FontWeight.Bold) }
                    )
                }
            }

            if (tabIndex == 0) {
                ScrollableTabRow(
                    selectedTabIndex = languages.indexOf(selectedLanguage),
                    edgePadding = 16.dp,
                    containerColor = MaterialTheme.colorScheme.surface,
                    contentColor = MaterialTheme.colorScheme.primary,
                    divider = {}
                ) {
                    languages.forEach { lang ->
                        Tab(
                            selected = selectedLanguage == lang,
                            onClick = { selectedLanguage = lang },
                            text = { Text(lang, fontWeight = FontWeight.Bold) }
                        )
                    }
                }
            }

            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 8.dp)) {
                            Icon(Icons.Default.Star, contentDescription = null, tint = Color(0xFFFFD700))
                            Spacer(Modifier.width(8.dp))
                            Text(
                                text = if (tabIndex == 0) "Top 10 Star Hosts" else "Top 10 Givers",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Black,
                                color = friendooColors.textPrimary
                            )
                        }
                    }

                    if (tabIndex == 0) {
                        items(starHosts) { host ->
                            val rank = (host["starRank"] as? Long)?.toInt() ?: 0
                            val alias = host["alias"] as? String ?: "Anonymous Host"
                            val avatarSeed = host["avatarSeed"] as? String ?: ""
                            val uid = host["id"] as? String ?: ""
                            val avgRating = (host["avgRating"] as? Number)?.toDouble() ?: 0.0
                            val totalCalls = (host["totalCalls"] as? Long)?.toInt() ?: 0

                            LeaderboardItem(
                                rank = rank,
                                alias = alias,
                                avatarSeed = avatarSeed,
                                uid = uid,
                                isHost = true,
                                avgRating = avgRating,
                                totalCalls = totalCalls
                            )
                        }

                        if (starHosts.isEmpty()) {
                            item {
                                Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                                    Text("No Star Hosts yet for this language.", color = friendooColors.textSecondary)
                                }
                            }
                        }
                    } else {
                        items(topGivers) { giver ->
                            val rank = giver["rank"] as? Int ?: 0
                            val alias = giver["alias"] as? String ?: "Anonymous User"
                            val avatarSeed = giver["avatarSeed"] as? String ?: ""
                            val uid = giver["uid"] as? String ?: ""
                            val coins = giver["coins"] as? Int ?: 0

                            LeaderboardItem(
                                rank = rank,
                                alias = alias,
                                avatarSeed = avatarSeed,
                                uid = uid,
                                isHost = false,
                                coins = coins
                            )
                        }

                        if (topGivers.isEmpty()) {
                            item {
                                Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                                    Text("No Top Givers yet.", color = friendooColors.textSecondary)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun LeaderboardItem(
    rank: Int,
    alias: String,
    avatarSeed: String,
    uid: String,
    isHost: Boolean,
    coins: Int = 0,
    avgRating: Double = 0.0,
    totalCalls: Int = 0
) {
    val friendooColors = LocalFriendooColors.current
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = if (rank <= 3) Color(0xFFFFD700).copy(alpha = 0.05f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f),
        border = if (rank <= 3) androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFFD700).copy(alpha = 0.3f)) else null
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .background(
                        color = when(rank) {
                            1 -> Color(0xFFFFD700)
                            2 -> Color(0xFFC0C0C0)
                            3 -> Color(0xFFCD7F32)
                            else -> Color.Gray.copy(alpha = 0.2f)
                        },
                        shape = CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "#$rank",
                    color = if (rank <= 3) Color.Black else Color.White,
                    fontWeight = FontWeight.Black,
                    fontSize = 12.sp
                )
            }

            Spacer(Modifier.width(16.dp))

            FriendooAvatar(
                avatarSeed = avatarSeed.ifBlank { uid },
                size = 48.dp
            )

            Spacer(Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(alias, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = friendooColors.textPrimary)
                if (isHost) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("⭐ ${String.format("%.1f", avgRating)}", style = MaterialTheme.typography.bodySmall, color = friendooColors.textSecondary)
                        Spacer(Modifier.width(8.dp))
                        Text("•", color = Color.Gray)
                        Spacer(Modifier.width(8.dp))
                        Text("$totalCalls Calls", style = MaterialTheme.typography.bodySmall, color = friendooColors.textSecondary)
                    }
                } else {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.Star,
                            contentDescription = null,
                            tint = Color(0xFFFFD700),
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(Modifier.width(4.dp))
                        Text("$coins coins sent", style = MaterialTheme.typography.bodySmall, color = friendooColors.textSecondary)
                    }
                }
            }

            if (rank <= 3) {
                Icon(
                    Icons.Default.Star,
                    contentDescription = "Star Badge",
                    tint = Color(0xFFFFD700),
                    modifier = Modifier.size(24.dp)
                )
            }
        }
    }
}
