package com.friendoo.app.presentation.discover

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.friendoo.app.data.model.Host
import com.friendoo.app.presentation.discover.components.HostCard

@Composable
fun DiscoverScreen(
    viewModel: DiscoverViewModel,
    onHostClick: (Host) -> Unit
) {
    val state by viewModel.state.collectAsState()

    Scaffold(
        topBar = {
            Column(modifier = Modifier.background(MaterialTheme.colorScheme.surface).padding(top = 16.dp)) {
                Text(
                    "Who do you want to talk to tonight?",
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Black
                )
                
                // Quick Match Button (Uber style)
                Button(
                    onClick = { /* Trigger Broadcast Call */ },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                        .height(64.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("⚡ Quick Match", fontWeight = FontWeight.Black, fontSize = 18.sp)
                        Text("Connect to any available host instantly — ₹5/min", fontSize = 11.sp, fontWeight = FontWeight.Light)
                    }
                }

                // Filter Row 1: Age
                FilterChipRow(
                    items = listOf("Teen 18–21", "Young Adult 22–29", "Adult 30–40", "Experienced 40+"),
                    selectedItem = (state as? DiscoverState.Success)?.filters?.ageGroup,
                    onSelected = { viewModel.toggleAgeFilter(it) }
                )

                // Filter Row 2: Vibe
                FilterChipRow(
                    items = listOf("Funny", "Good Listener", "Flirty", "Deep Talks", "Gives Advice", "Chill", "Wise", "Energetic"),
                    selectedItem = (state as? DiscoverState.Success)?.filters?.vibeTag,
                    onSelected = { viewModel.toggleVibeFilter(it) }
                )

                // Filter Row 3: Status Toggles
                Row(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    val filters = (state as? DiscoverState.Success)?.filters
                    StatusToggleChip(
                        label = "Top Hosts", 
                        icon = Icons.Default.Star, 
                        isActive = filters?.starOnly == true,
                        onClick = { viewModel.toggleStarOnly() }
                    )
                    StatusToggleChip(
                        label = "Online Now", 
                        isActive = filters?.onlineOnly == true,
                        onClick = { viewModel.toggleOnlineOnly() }
                    )
                }
                
                Divider(modifier = Modifier.padding(top = 8.dp), color = MaterialTheme.colorScheme.outlineVariant)
            }
        }
    ) { padding ->
        when (val currentState = state) {
            is DiscoverState.Loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
            is DiscoverState.Error -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Text(currentState.message) }
            is DiscoverState.Success -> {
                val filteredHosts = currentState.filteredHosts
                val starHosts = currentState.allHosts.filter { it.isStarHost == true }.take(5)

                LazyColumn(modifier = Modifier.fillMaxSize().padding(padding)) {
                    // Star Hosts Section (Horizontal)
                    if (starHosts.isNotEmpty() && currentState.filters.vibeTag == null && currentState.filters.ageGroup == null) {
                        item {
                            Column(modifier = Modifier.padding(vertical = 16.dp)) {
                                Text(
                                    "⭐ Top Hosts This Week",
                                    modifier = Modifier.padding(horizontal = 16.dp, bottom = 12.dp),
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 18.sp
                                )
                                LazyRow(
                                    contentPadding = PaddingValues(horizontal = 16.dp),
                                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                                ) {
                                    items(starHosts) { host ->
                                        HostCard(host = host, onCallClick = { onHostClick(host) }, modifier = Modifier.width(280.dp))
                                    }
                                }
                            }
                        }
                    }

                    // Main Feed
                    item {
                        Text(
                            "Online Now",
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                    }

                    if (filteredHosts.isEmpty()) {
                        item {
                            Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                                Text(
                                    "No hosts online with this vibe right now.\nTry a different filter or check back soon!",
                                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                                    color = Color.Gray
                                )
                            }
                        }
                    } else {
                        items(filteredHosts) { host ->
                            HostCard(host = host, onCallClick = { onHostClick(host) })
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun FilterChipRow(items: List<String>, selectedItem: String?, onSelected: (String) -> Unit) {
    LazyRow(
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(items) { label ->
            val isSelected = selectedItem == label
            FilterChip(
                selected = isSelected,
                onClick = { onSelected(label) },
                label = { Text(label, fontSize = 12.sp) },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = MaterialTheme.colorScheme.primary,
                    selectedLabelColor = Color.White
                ),
                shape = RoundedCornerShape(20.dp)
            )
        }
    }
}

@Composable
fun StatusToggleChip(label: String, icon: androidx.compose.ui.graphics.vector.ImageVector? = null, isActive: Boolean, onClick: () -> Unit) {
    FilterChip(
        selected = isActive,
        onClick = onClick,
        label = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (icon != null) {
                    Icon(icon, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                }
                Text(label, fontSize = 12.sp)
            }
        },
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = MaterialTheme.colorScheme.secondary,
            selectedLabelColor = Color.White
        ),
        shape = RoundedCornerShape(20.dp)
    )
}
