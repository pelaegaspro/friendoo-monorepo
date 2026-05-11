package com.friendoo.app.presentation.discover

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.friendoo.app.data.model.Host
import com.friendoo.app.presentation.components.*
import com.friendoo.app.presentation.discover.components.HostCard
import com.friendoo.app.presentation.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiscoverScreen(
    viewModel: DiscoverViewModel,
    onHostClick: (Host) -> Unit
) {
    val state by viewModel.state.collectAsState()
    var showFilterSheet by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize().background(WarmWhite)) {
        Scaffold(
            topBar = {
                Surface(
                    color = PureWhite,
                    shadowElevation = 0.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Logo wordmark
                            Text(
                                text = "friendoo",
                                style = MaterialTheme.typography.titleLarge,
                                color = Coral,
                                fontWeight = FontWeight.Bold
                            )
                            // Notification bell with badge
                            Box {
                                IconButton(onClick = { /* Open notifications */ }) {
                                    Icon(Icons.Default.Notifications, contentDescription = "Notifications", tint = DeepNavy)
                                }
                                // Badge dot
                                Box(
                                    modifier = Modifier
                                        .padding(top = 8.dp, end = 8.dp)
                                        .size(8.dp)
                                        .clip(CircleShape)
                                        .background(Coral)
                                        .align(Alignment.TopEnd)
                                )
                            }
                        }

                        // Greeting row with filter button
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Good evening",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = WarmGray
                                )
                                Text(
                                    text = "Who's online now?",
                                    style = MaterialTheme.typography.headlineSmall,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            IconButton(
                                onClick = { showFilterSheet = true },
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(SurfaceElevated)
                            ) {
                                Icon(Icons.Default.FilterList, contentDescription = "Filters", tint = DeepNavy)
                            }
                        }
                    }
                }
            }
        ) { padding ->
            when (val currentState = state) {
                is DiscoverState.Loading -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Coral)
                    }
                }
                is DiscoverState.Error -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        FriendooEmptyState(
                            title = "Something went wrong",
                            subtitle = currentState.message,
                            actionText = "Try Again",
                            onAction = { viewModel.loadHosts() }
                        )
                    }
                }
                is DiscoverState.Success -> {
                    val filteredHosts = currentState.filteredHosts
                    val starHosts = currentState.allHosts.filter { it.isStarHost == true }.take(5)
                    val hasActiveFilters = currentState.filters.let {
                        it.ageGroup != null || it.vibeTag != null || it.starOnly || it.onlineOnly
                    }

                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(padding)
                            .padding(bottom = 80.dp), // Space for FAB
                        contentPadding = PaddingValues(vertical = 16.dp)
                    ) {
                        // Quick Match Card
                        item {
                            QuickMatchCard(onClick = { /* Trigger Quick Match */ })
                        }

                        // Active filters chips
                        if (hasActiveFilters) {
                            item {
                                ActiveFiltersRow(
                                    filters = currentState.filters,
                                    onClearAll = { viewModel.updateFilters(DiscoverFilters()) },
                                    onClearAge = { viewModel.toggleAgeFilter(currentState.filters.ageGroup ?: "") },
                                    onClearVibe = { viewModel.toggleVibeFilter(currentState.filters.vibeTag ?: "") },
                                    onClearStar = { viewModel.toggleStarOnly() },
                                    onClearOnline = { viewModel.toggleOnlineOnly() }
                                )
                            }
                        }

                        // Star Hosts Horizontal Carousel
                        if (starHosts.isNotEmpty() && !hasActiveFilters) {
                            item {
                                FriendooSectionHeader(
                                    title = "Star Hosts",
                                    actionText = "See All"
                                ) {}
                                LazyRow(
                                    contentPadding = PaddingValues(horizontal = 16.dp),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    items(starHosts) { host ->
                                        StarHostCarouselItem(
                                            host = host,
                                            onClick = { onHostClick(host) }
                                        )
                                    }
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                            }
                        }

                        // Online Now Section
                        item {
                            FriendooSectionHeader(title = "Online Now")
                        }

                        if (filteredHosts.isEmpty()) {
                            item {
                                FriendooEmptyState(
                                    title = "No one's online",
                                    subtitle = "Try adjusting your filters or check back soon!",
                                    actionText = "Clear Filters",
                                    onAction = { viewModel.updateFilters(DiscoverFilters()) }
                                )
                            }
                        } else {
                            // 2-column grid using items in LazyColumn
                            val rows = filteredHosts.chunked(2)
                            items(rows) { rowHosts ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 16.dp),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    rowHosts.forEach { host ->
                                        FriendooHostCard(
                                            alias = host.alias.ifEmpty { "Host" },
                                            avatarColor = host.avatarColor,
                                            tags = host.vibeTags?.take(2) ?: emptyList(),
                                            pricePerMin = "₹${host.ratePerAudioMinute}/min",
                                            isOnline = host.isOnline,
                                            isStar = host.isStarHost == true,
                                            onCallClick = { onHostClick(host) },
                                            modifier = Modifier.weight(1f)
                                        )
                                    }
                                    if (rowHosts.size == 1) {
                                        Spacer(modifier = Modifier.weight(1f))
                                    }
                                }
                                Spacer(modifier = Modifier.height(12.dp))
                            }
                        }
                    }
                }
            }
        }

        // Quick Match FAB
        FloatingActionButton(
            onClick = { /* Trigger Quick Match */ },
            shape = CircleShape,
            containerColor = Coral,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(bottom = 88.dp, end = 16.dp)
                .size(64.dp)
        ) {
            Icon(Icons.Default.PlayArrow, contentDescription = "Quick Match", tint = PureWhite, modifier = Modifier.size(28.dp))
        }
    }

    // Filter Bottom Sheet
    if (showFilterSheet) {
        FilterBottomSheet(
            currentFilters = (state as? DiscoverState.Success)?.filters ?: DiscoverFilters(),
            onApply = { newFilters ->
                viewModel.updateFilters(newFilters)
                showFilterSheet = false
            },
            onDismiss = { showFilterSheet = false }
        )
    }
}

// === QUICK MATCH CARD ===
@Composable
fun QuickMatchCard(onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .height(80.dp),
        shape = CardShape,
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Brush.horizontalGradient(listOf(CoralGradientStart, CoralGradientEnd)))
        ) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 20.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(PureWhite.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.PlayArrow,
                            contentDescription = null,
                            tint = PureWhite,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "Quick Match",
                            color = PureWhite,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Connect instantly with any host",
                            color = PureWhite.copy(alpha = 0.8f),
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    FriendooPricePill(price = "₹5/min")
                    Spacer(modifier = Modifier.width(8.dp))
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(PureWhite.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.ArrowForward,
                            contentDescription = null,
                            tint = PureWhite,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }
    }
}

// === STAR HOST CAROUSEL ITEM ===
@Composable
fun StarHostCarouselItem(host: Host, onClick: () -> Unit) {
    val bgColor = try { Color(android.graphics.Color.parseColor(host.avatarColor)) } catch (_: Exception) { Coral }

    Card(
        onClick = onClick,
        modifier = Modifier.width(280.dp),
        shape = CardShape,
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(160.dp)
                .background(Brush.verticalGradient(listOf(bgColor.copy(alpha = 0.3f), bgColor.copy(alpha = 0.1f))))
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Surface(
                        color = SoftYellow.copy(alpha = 0.9f),
                        shape = ChipShape
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Star, contentDescription = null, tint = WarningAmber, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("#${host.starRank ?: 1}", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                        }
                    }
                    FriendooPricePill(price = "₹${host.ratePerAudioMinute}/min")
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    FriendooAvatar(
                        alias = host.alias.ifEmpty { "Host" },
                        colorHex = host.avatarColor,
                        size = 48.dp,
                        fontSize = 18
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = host.alias.ifEmpty { "Star Host" },
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = DeepNavy
                        )
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Star, contentDescription = null, tint = WarningAmber, modifier = Modifier.size(14.dp))
                            Text(
                                text = " ${String.format("%.1f", host.avgRating ?: 5.0)}",
                                style = MaterialTheme.typography.bodySmall,
                                color = WarmGray
                            )
                        }
                    }
                }
            }

            // Floating Call FAB
            FloatingActionButton(
                onClick = onClick,
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .size(44.dp),
                shape = CircleShape,
                containerColor = Coral,
                elevation = FloatingActionButtonDefaults.elevation(defaultElevation = 0.dp)
            ) {
                Icon(Icons.Default.Call, contentDescription = "Call", tint = PureWhite, modifier = Modifier.size(20.dp))
            }
        }
    }
}

// === ACTIVE FILTERS ROW ===
@Composable
fun ActiveFiltersRow(
    filters: DiscoverFilters,
    onClearAll: () -> Unit,
    onClearAge: () -> Unit,
    onClearVibe: () -> Unit,
    onClearStar: () -> Unit,
    onClearOnline: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.weight(1f)
        ) {
            filters.ageGroup?.let {
                item {
                    FilterChipSmall(text = it, onRemove = onClearAge)
                }
            }
            filters.vibeTag?.let {
                item {
                    FilterChipSmall(text = it, onRemove = onClearVibe)
                }
            }
            if (filters.starOnly) {
                item {
                    FilterChipSmall(text = "Star Hosts", onRemove = onClearStar)
                }
            }
            if (filters.onlineOnly) {
                item {
                    FilterChipSmall(text = "Online", onRemove = onClearOnline)
                }
            }
        }
        TextButton(onClick = onClearAll) {
            Text("Clear", color = Coral, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
fun FilterChipSmall(text: String, onRemove: () -> Unit) {
    Surface(
        shape = ChipShape,
        color = Coral.copy(alpha = 0.1f),
        border = androidx.compose.foundation.BorderStroke(1.dp, Coral.copy(alpha = 0.3f))
    ) {
        Row(
            modifier = Modifier.padding(start = 10.dp, end = 6.dp, top = 6.dp, bottom = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text, style = MaterialTheme.typography.labelSmall, color = Coral, fontWeight = FontWeight.Medium)
            Spacer(modifier = Modifier.width(4.dp))
            Icon(
                Icons.Default.Close,
                contentDescription = "Remove",
                tint = Coral,
                modifier = Modifier
                    .size(14.dp)
                    .clickable { onRemove() }
            )
        }
    }
}

// === FILTER BOTTOM SHEET ===
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FilterBottomSheet(
    currentFilters: DiscoverFilters,
    onApply: (DiscoverFilters) -> Unit,
    onDismiss: () -> Unit
) {
    var tempFilters by remember { mutableStateOf(currentFilters) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        shape = BottomSheetShape,
        containerColor = PureWhite
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .padding(bottom = 32.dp)
        ) {
            // Handle
            Box(
                modifier = Modifier
                    .padding(top = 8.dp, bottom = 16.dp)
                    .width(40.dp)
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(BorderLight)
                    .align(Alignment.CenterHorizontally)
            )

            Text(
                text = "Filters",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Age group
            Text("Age Group", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            Spacer(modifier = Modifier.height(8.dp))
            val ageOptions = listOf("Teen 18-21", "Young Adult 22-29", "Adult 30-40", "Experienced 40+")
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                ageOptions.forEach { age ->
                    val isSelected = tempFilters.ageGroup == age
                    FilterToggleChip(
                        text = age,
                        isSelected = isSelected,
                        onClick = {
                            tempFilters = tempFilters.copy(
                                ageGroup = if (isSelected) null else age
                            )
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Vibe tags
            Text("Vibe", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            Spacer(modifier = Modifier.height(8.dp))
            val vibeOptions = listOf("Funny", "Good Listener", "Deep Talks", "Gives Advice", "Chill", "Wise", "Energetic")
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                vibeOptions.forEach { vibe ->
                    val isSelected = tempFilters.vibeTag == vibe
                    FilterToggleChip(
                        text = vibe,
                        isSelected = isSelected,
                        onClick = {
                            tempFilters = tempFilters.copy(
                                vibeTag = if (isSelected) null else vibe
                            )
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Toggles
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Star Hosts only", style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
                Switch(
                    checked = tempFilters.starOnly,
                    onCheckedChange = { tempFilters = tempFilters.copy(starOnly = it) },
                    colors = SwitchDefaults.colors(checkedThumbColor = Coral, checkedTrackColor = Coral.copy(alpha = 0.5f))
                )
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Online now", style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
                Switch(
                    checked = tempFilters.onlineOnly,
                    onCheckedChange = { tempFilters = tempFilters.copy(onlineOnly = it) },
                    colors = SwitchDefaults.colors(checkedThumbColor = Coral, checkedTrackColor = Coral.copy(alpha = 0.5f))
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            FriendooButton(
                text = "Apply Filters",
                onClick = { onApply(tempFilters) }
            )

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
fun FilterToggleChip(text: String, isSelected: Boolean, onClick: () -> Unit) {
    Surface(
        shape = ChipShape,
        color = if (isSelected) Coral.copy(alpha = 0.1f) else SurfaceElevated,
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (isSelected) Coral else BorderLight
        ),
        modifier = Modifier.clickable { onClick() }
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelLarge,
            color = if (isSelected) Coral else DeepNavy,
            fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
        )
    }
}
