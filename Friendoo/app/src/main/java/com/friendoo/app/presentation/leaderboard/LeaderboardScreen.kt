package com.friendoo.app.presentation.leaderboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.friendoo.app.presentation.components.AnonymousAvatar
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LeaderboardScreen() {
    var selectedLanguage by remember { mutableStateOf("Hindi") }
    val languages = listOf("Hindi", "English", "Tamil", "Telugu", "Bengali")
    var starHosts by remember { mutableStateOf<List<Map<String, Any>>>(emptyList()) }
    val db = FirebaseFirestore.getInstance()

    LaunchedEffect(selectedLanguage) {
        db.collection("hosts")
            .whereEqualTo("isStarHost", true)
            .whereEqualTo("starLanguage", selectedLanguage)
            .orderBy("starRank", Query.Direction.ASCENDING)
            .get()
            .addOnSuccessListener {
                starHosts = it.docs.map { doc -> doc.data() + ("id" to doc.id) }
            }
    }

    Column(modifier = Modifier.fillMaxSize()) {
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

        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 8.dp)) {
                    Icon(Icons.Default.Star, contentDescription = null, tint = Color(0xFFFFD700))
                    Spacer(Modifier.width(8.dp))
                    Text("Top 10 Star Hosts", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
                }
            }

            items(starHosts) { host ->
                LeaderboardItem(host)
            }
            
            if (starHosts.isEmpty()) {
                item {
                    Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                        Text("No Star Hosts yet for this language.", color = Color.Gray)
                    }
                }
            }
        }
    }
}

@Composable
fun LeaderboardItem(host: Map<String, Any>) {
    val rank = (host["starRank"] as? Long)?.toInt() ?: 0
    val alias = host["alias"] as? String ?: "Anonymous Host"
    val avatarColor = host["avatarColor"] as? String ?: "#3700B3"
    val avgRating = (host["avgRating"] as? Number)?.toDouble() ?: 0.0
    val totalCalls = (host["totalCalls"] as? Long)?.toInt() ?: 0

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
            // Rank Number
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

            AnonymousAvatar(
                alias = alias,
                avatarColorHex = avatarColor,
                size = 48.dp,
                fontSize = 16
            )

            Spacer(Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(alias, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("⭐ ${String.format("%.1f", avgRating)}", style = MaterialTheme.typography.bodySmall)
                    Spacer(Modifier.width(8.dp))
                    Text("•", color = Color.Gray)
                    Spacer(Modifier.width(8.dp))
                    Text("$totalCalls Calls", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                }
            }
            
            if (rank <= 3) {
                Icon(Icons.Default.TrendingUp, contentDescription = null, tint = Color(0xFFFFD700), modifier = Modifier.size(24.dp))
            }
        }
    }
}
