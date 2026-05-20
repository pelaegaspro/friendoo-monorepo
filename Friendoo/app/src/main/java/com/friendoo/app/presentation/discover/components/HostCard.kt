package com.friendoo.app.presentation.discover.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.friendoo.app.data.model.Host
import com.friendoo.app.presentation.components.FriendooAvatar
import com.friendoo.app.presentation.theme.*

@Composable
fun HostCard(
    host: Host,
    onCallClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val friendooColors = LocalFriendooColors.current
    Card(
        modifier = modifier.fillMaxWidth().padding(8.dp),
        shape = RoundedCornerShape(20.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp)
                    .background(MaterialTheme.colorScheme.surfaceVariant),
                contentAlignment = Alignment.Center
            ) {
                FriendooAvatar(
                    avatarSeed = host.avatarSeed.ifBlank { host.uid },
                    size = 100.dp
                )

                if (host.isOnline) {
                    Box(
                        modifier = Modifier
                            .padding(8.dp)
                            .size(12.dp)
                            .clip(CircleShape)
                            .background(SuccessGreen)
                            .align(Alignment.TopEnd)
                    )
                }

                if (host.isStarHost == true) {
                    Surface(
                        modifier = Modifier.align(Alignment.TopStart).padding(8.dp),
                        shape = RoundedCornerShape(8.dp),
                        color = Gold.copy(alpha = 0.9f)
                    ) {
                        Row(modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Star, contentDescription = null, tint = DeepPlum, modifier = Modifier.size(14.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("STAR #${host.starRank}", color = DeepPlum, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black)
                        }
                    }
                }

                Surface(
                    modifier = Modifier.align(Alignment.BottomEnd).padding(8.dp),
                    shape = RoundedCornerShape(8.dp),
                    color = Violet.copy(alpha = 0.15f)
                ) {
                    Row(modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp), verticalAlignment = Alignment.CenterVertically) {
                        if (host.isStarHost == true) {
                            Text(
                                text = "₹10",
                                style = MaterialTheme.typography.bodySmall.copy(textDecoration = androidx.compose.ui.text.style.TextDecoration.LineThrough),
                                color = friendooColors.textHint,
                                modifier = Modifier.padding(end = 4.dp)
                            )
                            Text(
                                text = "₹7/min",
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.Bold,
                                color = Gold
                            )
                        } else {
                            Text(
                                text = "₹5/min",
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.Bold,
                                color = Violet
                            )
                        }
                    }
                }
            }
            Column(modifier = Modifier.padding(12.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = host.alias.ifEmpty { "Anonymous Host" },
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = friendooColors.textPrimary
                    )
                    Spacer(modifier = Modifier.weight(1f))
                    val ratingText = if ((host.ratingCount ?: 0) < 3) "New" else "⭐ ${String.format("%.1f", host.avgRating ?: 0.0)}"
                    Text(
                        text = ratingText,
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = if (ratingText == "New") FontWeight.Bold else FontWeight.Normal,
                        color = if (ratingText == "New") Violet else friendooColors.textPrimary
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                val vibeText = buildString {
                    append(host.ageGroup ?: "Young Adult")
                    host.vibeTags?.take(2)?.forEach { tag ->
                        append(" · $tag")
                    }
                }
                Text(
                    text = vibeText,
                    style = MaterialTheme.typography.bodySmall,
                    color = Mint,
                    fontWeight = FontWeight.Medium
                )

                Spacer(modifier = Modifier.height(4.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "★ ${String.format("%.1f", host.avgRating ?: 0.0)}",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Bold,
                        color = friendooColors.textPrimary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "(${host.totalCalls} calls)",
                        style = MaterialTheme.typography.bodySmall,
                        color = friendooColors.textSecondary
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                val buttonText = when(host.callStatus) {
                    "available" -> "Call Now"
                    "busy" -> "Busy · Try Quick Match"
                    else -> "Currently Offline"
                }

                Button(
                    onClick = onCallClick,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    enabled = host.callStatus != "offline",
                    colors = if (host.callStatus == "busy") ButtonDefaults.buttonColors(containerColor = Mint) else ButtonDefaults.buttonColors(containerColor = Violet)
                ) {
                    Text(buttonText, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
