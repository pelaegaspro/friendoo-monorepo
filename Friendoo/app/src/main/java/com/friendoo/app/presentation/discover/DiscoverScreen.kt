@file:OptIn(
    androidx.compose.material3.ExperimentalMaterial3Api::class,
    androidx.compose.foundation.layout.ExperimentalLayoutApi::class
)
package com.friendoo.app.presentation.discover

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.friendoo.app.core.model.CallType
import com.friendoo.app.data.model.Host
import com.friendoo.app.presentation.components.*
import com.friendoo.app.presentation.theme.*
import java.net.URLEncoder

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiscoverScreen(
    viewModel: DiscoverViewModel,
    onHostClick: (Host, CallType) -> Unit,
    onQuickMatch: () -> Unit = {},
    onWalletClick: () -> Unit = {}
) {
    val state by viewModel.state.collectAsState()
    val coins by viewModel.coinBalance.collectAsState()
    var showFilterSheet by remember { mutableStateOf(false) }
    var selectedHostForCall by remember { mutableStateOf<Host?>(null) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFFFFD4DC),
                        Color(0xFFFFEDF1),
                        Color(0xFFEAF4FF),
                        Color(0xFFFFFFFF)
                    )
                )
            )
    ) {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = { DiscoverTopBar(coins = coins, onWalletClick = onWalletClick) }
        ) { padding ->
            when (val currentState = state) {
                is DiscoverState.Loading -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Violet)
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
                    val hasActiveFilters = currentState.filters.let {
                        it.ageGroup != null || it.vibeTag != null || it.starOnly || it.onlineOnly
                    }

                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(padding),
                        contentPadding = PaddingValues(start = 8.dp, end = 8.dp, bottom = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        item {
                            HeroQuickMatchCard(onClick = onQuickMatch)
                        }

                        item {
                            Column(modifier = Modifier.padding(horizontal = 4.dp)) {
                                Text(
                                    text = "Featured Experts",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF15151A)
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                ReferenceFilterChips(
                                    filters = currentState.filters,
                                    onAll = { viewModel.updateFilters(DiscoverFilters()) },
                                    onStar = { viewModel.toggleStarOnly() },
                                    onOnline = { viewModel.toggleOnlineOnly() },
                                    onGoodListener = { viewModel.toggleVibeFilter("Good Listener") },
                                    onDeepTalks = { viewModel.toggleVibeFilter("Deep Talks") },
                                    onFunny = { viewModel.toggleVibeFilter("Funny") },
                                    onMore = { showFilterSheet = true }
                                )
                            }
                        }

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

                        if (filteredHosts.isEmpty()) {
                            item {
                                FriendooEmptyState(
                                    title = "No hosts online",
                                    subtitle = "Try adjusting your filters or check back soon!",
                                    actionText = "Clear Filters",
                                    onAction = { viewModel.updateFilters(DiscoverFilters()) }
                                )
                            }
                        } else if (hasActiveFilters) {
                            items(filteredHosts) { host ->
                                DiscoverExpertListCard(
                                    host = host,
                                    onCallClick = { selectedHostForCall = host }
                                )
                            }
                        } else {
                            currentState.sections.forEach { section ->
                                item {
                                    Text(
                                        text = section.title,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFF15151A),
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 8.dp)
                                    )
                                }
                                item {
                                    LazyRow(
                                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                                        contentPadding = PaddingValues(horizontal = 8.dp)
                                    ) {
                                        items(section.hosts, key = { it.uid }) { host ->
                                            DiscoverHostHorizontalCard(
                                                host = host,
                                                onCallClick = { selectedHostForCall = host }
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
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

    // Call Type Selection Bottom Sheet
    selectedHostForCall?.let { host ->
        CallTypeSelectionSheet(
            host = host,
            onSelect = { callType ->
                onHostClick(host, callType)
                selectedHostForCall = null
            },
            onDismiss = { selectedHostForCall = null }
        )
    }
}

@Composable
fun DiscoverTopBar(coins: Int, onWalletClick: () -> Unit) {
    Surface(
        color = Color.Transparent,
        shadowElevation = 0.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "friendoo",
                style = MaterialTheme.typography.headlineSmall,
                color = Color(0xFF1D1A20),
                fontWeight = FontWeight.ExtraBold,
                fontSize = 24.sp
            )

            CoinBalancePill(coins = coins, onClick = onWalletClick)
        }
    }
}

// === HERO QUICK MATCH CARD ===
@Composable
fun HeroQuickMatchCard(onClick: () -> Unit) {
    val infiniteTransition = rememberInfiniteTransition(label = "hero")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.03f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = EaseInOutCubic),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .scale(pulseScale),
        shape = HeroCardShape,
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(140.dp)
                .background(
                    Brush.linearGradient(
                        colors = listOf(GradientStart, GradientMid, GradientEnd)
                    )
                )
        ) {
            // Decorative circles
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .offset(x = (-20).dp, y = (-30).dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.08f))
            )
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .align(Alignment.BottomEnd)
                    .offset(x = 20.dp, y = 20.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.06f))
            )

            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 24.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = Color.White.copy(alpha = 0.2f)
                    ) {
                        Text(
                            text = "INSTANT CONNECT",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.5.sp,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                    Spacer(Modifier.height(10.dp))
                    Text(
                        text = "Quick Match",
                        color = Color.White,
                        style = MaterialTheme.typography.headlineLarge,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "Find someone to talk to right now",
                        color = Color.White.copy(alpha = 0.85f),
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                }

                Surface(
                    shape = CircleShape,
                    color = Color.White,
                    modifier = Modifier.size(56.dp),
                    shadowElevation = 4.dp
                ) {
                    Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                        Icon(
                            Icons.Default.PlayArrow,
                            contentDescription = "Start",
                            tint = Violet,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                }
            }
        }
    }
}

// === SECTION HEADER ===
@Composable
fun SectionHeader(title: String, actionText: String? = null, onAction: (() -> Unit)? = null) {
    val friendooColors = LocalFriendooColors.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = friendooColors.textPrimary
        )
        if (actionText != null && onAction != null) {
            TextButton(onClick = onAction) {
                Text(actionText, color = Violet, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

// === STAR HOST CAROUSEL ITEM ===
@Composable
fun StarHostCarouselItem(host: Host, onClick: () -> Unit) {
    val bgColor = try { Color(android.graphics.Color.parseColor(host.avatarColor)) } catch (_: Exception) { Violet }
    val friendooColors = LocalFriendooColors.current

    Card(
        onClick = onClick,
        modifier = Modifier.width(260.dp),
        shape = CardShape,
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(150.dp)
                .background(
                    Brush.verticalGradient(
                        listOf(bgColor.copy(alpha = 0.15f), bgColor.copy(alpha = 0.05f))
                    )
                )
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
                        color = WarningAmber.copy(alpha = 0.15f),
                        shape = ChipShape
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Star, contentDescription = null, tint = Gold, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("#${host.starRank ?: 1}", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = friendooColors.textPrimary)
                        }
                    }
                    PricePill(price = "₹${host.ratePerAudioMinute}/min")
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    FriendooAvatar(
                        avatarSeed = host.avatarSeed.ifBlank { host.uid },
                        size = 44.dp
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = host.alias.ifEmpty { "Star Host" },
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = friendooColors.textPrimary
                        )
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Star, contentDescription = null, tint = Gold, modifier = Modifier.size(14.dp))
                            Text(
                                text = " ${String.format("%.1f", host.avgRating ?: 5.0)}",
                                style = MaterialTheme.typography.bodySmall,
                                color = friendooColors.textSecondary
                            )
                        }
                    }
                }
            }

            FloatingActionButton(
                onClick = onClick,
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .size(40.dp),
                shape = CircleShape,
                containerColor = Violet,
                elevation = FloatingActionButtonDefaults.elevation(defaultElevation = 0.dp)
            ) {
                Icon(Icons.Default.Call, contentDescription = "Call", tint = PureWhite, modifier = Modifier.size(18.dp))
            }
        }
    }
}

// === PRICE PILL ===
@Composable
fun PricePill(price: String) {
    Surface(
        shape = ChipShape,
        color = Violet.copy(alpha = 0.1f)
    ) {
        Text(
            text = price,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = Violet,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}

// === CALL TYPE SELECTION SHEET ===
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CallTypeSelectionSheet(
    host: Host,
    onSelect: (CallType) -> Unit,
    onDismiss: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState()
    val friendooColors = LocalFriendooColors.current

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = MaterialTheme.colorScheme.surface,
        shape = BottomSheetShape
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 16.dp)
        ) {
            Text(
                text = "Start a call with ${host.alias.ifEmpty { "Host" }}",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = friendooColors.textPrimary
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = if (host.supportsVideo) "Choose how you'd like to connect" else "This host is available for audio calls",
                style = MaterialTheme.typography.bodyMedium,
                color = friendooColors.textSecondary
            )
            Spacer(modifier = Modifier.height(24.dp))

            // Audio Call Option
            Card(
                onClick = { onSelect(CallType.AUDIO) },
                modifier = Modifier.fillMaxWidth(),
                shape = CardShape,
                colors = CardDefaults.cardColors(containerColor = Violet.copy(alpha = 0.08f))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = CircleShape,
                        color = Violet,
                        modifier = Modifier.size(48.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                            Icon(Icons.Default.Call, contentDescription = null, tint = PureWhite, modifier = Modifier.size(24.dp))
                        }
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Audio Call",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = friendooColors.textPrimary
                        )
                        Text(
                            text = "Voice only, with safety monitoring",
                            style = MaterialTheme.typography.bodySmall,
                            color = friendooColors.textSecondary
                        )
                    }
                    PricePill(price = "₹${host.ratePerAudioMinute}/min")
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (host.supportsVideo) {
                // Video Call Option
                Card(
                    onClick = { onSelect(CallType.VIDEO) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = CardShape,
                    colors = CardDefaults.cardColors(containerColor = Mint.copy(alpha = 0.08f))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = Mint,
                            modifier = Modifier.size(48.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                                Icon(Icons.Default.Videocam, contentDescription = null, tint = PureWhite, modifier = Modifier.size(24.dp))
                            }
                        }
                        Spacer(modifier = Modifier.width(16.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Video Call",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = friendooColors.textPrimary
                            )
                            Text(
                                text = "Face-to-face video conversation",
                                style = MaterialTheme.typography.bodySmall,
                                color = friendooColors.textSecondary
                            )
                        }
                        PricePill(price = "₹${host.ratePerVideoMinute}/min")
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
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
            filters.ageGroup?.let { item { FilterChipSmall(text = it, onRemove = onClearAge) } }
            filters.vibeTag?.let { item { FilterChipSmall(text = it, onRemove = onClearVibe) } }
            if (filters.starOnly) item { FilterChipSmall(text = "Star Hosts", onRemove = onClearStar) }
            if (filters.onlineOnly) item { FilterChipSmall(text = "Online", onRemove = onClearOnline) }
        }
        TextButton(onClick = onClearAll) {
            Text("Clear", color = Violet, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
fun FilterChipSmall(text: String, onRemove: () -> Unit) {
    Surface(
        shape = ChipShape,
        color = Violet.copy(alpha = 0.1f),
        border = androidx.compose.foundation.BorderStroke(1.dp, Violet.copy(alpha = 0.3f))
    ) {
        Row(
            modifier = Modifier.padding(start = 10.dp, end = 6.dp, top = 6.dp, bottom = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text, style = MaterialTheme.typography.labelSmall, color = Violet, fontWeight = FontWeight.Medium)
            Spacer(modifier = Modifier.width(4.dp))
            Icon(
                Icons.Default.Close,
                contentDescription = "Remove",
                tint = Violet,
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
    val friendooColors = LocalFriendooColors.current

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        shape = BottomSheetShape,
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .padding(bottom = 32.dp)
        ) {
            Box(
                modifier = Modifier
                    .padding(top = 8.dp, bottom = 16.dp)
                    .width(40.dp)
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(MaterialTheme.colorScheme.outline)
                    .align(Alignment.CenterHorizontally)
            )

            Text(
                text = "Filters",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = friendooColors.textPrimary
            )

            Spacer(modifier = Modifier.height(24.dp))

            Text("Age Group", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold, color = friendooColors.textPrimary)
            Spacer(modifier = Modifier.height(8.dp))
            val ageOptions = listOf("Teen 18-21", "Young Adult 22-29", "Adult 30-40", "Experienced 40+")
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                ageOptions.forEach { age ->
                    val isSelected = tempFilters.ageGroup == age
                    FilterToggleChip(text = age, isSelected = isSelected) {
                        tempFilters = tempFilters.copy(ageGroup = if (isSelected) null else age)
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text("Vibe", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold, color = friendooColors.textPrimary)
            Spacer(modifier = Modifier.height(8.dp))
            val vibeOptions = listOf("Funny", "Good Listener", "Deep Talks", "Gives Advice", "Chill", "Wise", "Energetic")
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                vibeOptions.forEach { vibe ->
                    val isSelected = tempFilters.vibeTag == vibe
                    FilterToggleChip(text = vibe, isSelected = isSelected) {
                        tempFilters = tempFilters.copy(vibeTag = if (isSelected) null else vibe)
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text("Star Hosts only", style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f), color = friendooColors.textPrimary)
                Switch(
                    checked = tempFilters.starOnly,
                    onCheckedChange = { tempFilters = tempFilters.copy(starOnly = it) },
                    colors = SwitchDefaults.colors(checkedThumbColor = Violet, checkedTrackColor = Violet.copy(alpha = 0.5f))
                )
            }
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text("Online now", style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f), color = friendooColors.textPrimary)
                Switch(
                    checked = tempFilters.onlineOnly,
                    onCheckedChange = { tempFilters = tempFilters.copy(onlineOnly = it) },
                    colors = SwitchDefaults.colors(checkedThumbColor = Violet, checkedTrackColor = Violet.copy(alpha = 0.5f))
                )
            }

            Spacer(modifier = Modifier.height(32.dp))
            FriendooButton(text = "Apply Filters", onClick = { onApply(tempFilters) })
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
fun FilterToggleChip(text: String, isSelected: Boolean, onClick: () -> Unit) {
    val friendooColors = LocalFriendooColors.current
    Surface(
        shape = ChipShape,
        color = if (isSelected) Violet.copy(alpha = 0.1f) else MaterialTheme.colorScheme.surfaceVariant,
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (isSelected) Violet else MaterialTheme.colorScheme.outline
        ),
        modifier = Modifier.clickable { onClick() }
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelLarge,
            color = if (isSelected) Violet else friendooColors.textPrimary,
            fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
        )
    }
}

@Composable
fun ReferenceFilterChips(
    filters: DiscoverFilters,
    onAll: () -> Unit,
    onStar: () -> Unit,
    onOnline: () -> Unit,
    onGoodListener: () -> Unit,
    onDeepTalks: () -> Unit,
    onFunny: () -> Unit,
    onMore: () -> Unit
) {
    val chips = listOf(
        "All" to (filters == DiscoverFilters()),
        "Star" to filters.starOnly,
        "Online" to filters.onlineOnly,
        "Good Listener" to (filters.vibeTag == "Good Listener"),
        "Deep Talks" to (filters.vibeTag == "Deep Talks"),
        "Funny" to (filters.vibeTag == "Funny")
    )

    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(end = 8.dp)
    ) {
        items(chips) { (label, selected) ->
            Surface(
                onClick = {
                    when (label) {
                        "All" -> onAll()
                        "Star" -> onStar()
                        "Online" -> onOnline()
                        "Good Listener" -> onGoodListener()
                        "Deep Talks" -> onDeepTalks()
                        "Funny" -> onFunny()
                    }
                },
                shape = RoundedCornerShape(14.dp),
                color = if (selected) Color(0xFF8A4FD6) else Color.White.copy(alpha = 0.78f),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    if (selected) Color(0xFF8A4FD6) else Color(0xFFD9A8C1)
                )
            ) {
                Text(
                    text = label,
                    color = if (selected) Color.White else Color(0xFF3D3144),
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp)
                )
            }
        }
        item {
            Surface(
                onClick = onMore,
                shape = CircleShape,
                color = Color.White.copy(alpha = 0.78f),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFD9A8C1))
            ) {
                Icon(
                    Icons.Default.FilterList,
                    contentDescription = "More filters",
                    tint = Color(0xFF3D3144),
                    modifier = Modifier
                        .padding(7.dp)
                        .size(18.dp)
                )
            }
        }
    }
}

@Composable
fun DiscoverExpertListCard(
    host: Host,
    onCallClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isAvailable = host.isOnline && host.callStatus == "available"
    val primaryLanguage = host.languages.firstOrNull().orEmpty().ifBlank { host.starLanguage ?: "Tamil" }
    val secondaryLanguage = host.languages.drop(1).firstOrNull()
    val age = displayAge(host)
    val location = displayLocation(host)
    val expertise = host.vibeTags?.firstOrNull()
        ?: when {
            host.bio.contains("marriage", ignoreCase = true) -> "Marriage"
            host.bio.contains("confiden", ignoreCase = true) -> "Confidence"
            else -> "Relationship"
        }
    val rate = if (host.isStarHost == true) {
        "Rs.${host.ratePerAudioMinute}/min Rs.${maxOf(host.ratePerAudioMinute - 3, 5)}/min"
    } else {
        "Rs.${host.ratePerAudioMinute}/min"
    }
    val quote = host.bio.ifBlank { sampleQuote(host) }

    Card(
        onClick = onCallClick,
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.95f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Box(modifier = Modifier.fillMaxWidth()) {
            if (host.isStarHost == true) {
                Surface(
                    color = Color(0xFFE92A7D),
                    shape = RoundedCornerShape(topStart = 8.dp, bottomEnd = 8.dp),
                    modifier = Modifier.align(Alignment.TopStart)
                ) {
                    Text(
                        text = "Star",
                        color = Color.White,
                        style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp),
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 10.dp, end = 10.dp, top = 10.dp, bottom = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(modifier = Modifier.width(56.dp), contentAlignment = Alignment.Center) {
                    ExpertAvatar(host = host, isAvailable = isAvailable)
                    Surface(
                        shape = RoundedCornerShape(9.dp),
                        color = Color.White,
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFFD85A)),
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .offset(y = 9.dp)
                    ) {
                        Text(
                            text = if (isAvailable) "Busy" else "Busy",
                            color = Color(0xFFD9A400),
                            style = MaterialTheme.typography.labelSmall.copy(fontSize = 8.sp),
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 7.dp, vertical = 1.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.width(10.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = host.alias.ifBlank { "Friendoo Expert" },
                            style = MaterialTheme.typography.titleSmall.copy(fontSize = 13.sp),
                            fontWeight = FontWeight.ExtraBold,
                            color = Color(0xFF24212A),
                            maxLines = 1,
                            overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f, fill = false)
                        )
                        Text(
                            text = " - $age Y",
                            style = MaterialTheme.typography.bodySmall.copy(fontSize = 10.sp),
                            color = Color(0xFF8A8490)
                        )
                    }
                    Text(
                        text = location,
                        style = MaterialTheme.typography.bodySmall.copy(fontSize = 10.sp),
                        color = Color(0xFF38323C),
                        maxLines = 1,
                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                    )
                    Text(
                        text = expertise,
                        style = MaterialTheme.typography.bodySmall.copy(fontSize = 10.sp),
                        color = Color(0xFFE05B96),
                        maxLines = 1,
                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                    )
                    Text(
                        text = rate,
                        style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                        fontWeight = FontWeight.ExtraBold,
                        color = Color(0xFF111111),
                        maxLines = 1
                    )
                }

                Spacer(modifier = Modifier.width(8.dp))

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = listOf(primaryLanguage, secondaryLanguage).filter { !it.isNullOrBlank() }.joinToString(" - "),
                        style = MaterialTheme.typography.bodySmall.copy(fontSize = 10.sp),
                        color = Color(0xFF4F4752),
                        maxLines = 1,
                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
                        modifier = Modifier.widthIn(max = 96.dp)
                    )
                    Spacer(modifier = Modifier.height(18.dp))
                    Button(
                        onClick = onCallClick,
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4F8EF7)),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp),
                        modifier = Modifier.height(34.dp)
                    ) {
                        Icon(Icons.Default.Call, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Call Now",
                            color = Color.White,
                            style = MaterialTheme.typography.labelMedium.copy(fontSize = 11.sp),
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            Row(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(start = 20.dp, bottom = 3.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.Star, contentDescription = null, tint = Color(0xFFFFD34D), modifier = Modifier.size(10.dp))
                Text(
                    text = String.format("%.1f", host.avgRating ?: 4.8),
                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 9.sp),
                    color = Color(0xFF6E6500),
                    fontWeight = FontWeight.Bold
                )
            }

            Text(
                text = "\"${quote}\"",
                style = MaterialTheme.typography.bodySmall.copy(fontSize = 9.sp),
                color = Color(0xFF8D8791),
                maxLines = 1,
                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(start = 72.dp, end = 12.dp, bottom = 3.dp)
            )
        }
    }
}

@Composable
private fun ExpertAvatar(host: Host, isAvailable: Boolean) {
    Box(contentAlignment = Alignment.Center, modifier = Modifier.size(54.dp)) {
        Box(
            modifier = Modifier
                .size(50.dp)
                .clip(CircleShape)
                .background(Color(0xFFFFE0EC))
                .border(2.dp, Color.White, CircleShape)
        ) {
            val context = LocalContext.current
            val seed = host.avatarSeed.ifBlank { host.uid.ifBlank { host.alias } }
            val encodedSeed = URLEncoder.encode(seed, "UTF-8")
            val avatarUrl = "https://api.dicebear.com/7.x/adventurer/png?seed=$encodedSeed&gender=female"

            AsyncImage(
                model = ImageRequest.Builder(context)
                    .data(avatarUrl)
                    .crossfade(true)
                    .build(),
                contentDescription = host.alias,
                modifier = Modifier
                    .fillMaxSize()
                    .clip(CircleShape)
            )
        }
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .size(10.dp)
                .clip(CircleShape)
                .background(if (isAvailable) Color(0xFFFFC400) else Color(0xFFFFC400))
                .border(1.dp, Color.White, CircleShape)
        )
    }
}

private fun displayAge(host: Host): Int {
    return when {
        host.ageGroup?.contains("18", ignoreCase = true) == true -> 22
        host.ageGroup?.contains("22", ignoreCase = true) == true -> 27
        host.ageGroup?.contains("30", ignoreCase = true) == true -> 34
        host.ageGroup?.contains("40", ignoreCase = true) == true -> 37
        else -> 25 + stableIndex(host.uid.ifBlank { host.alias }, 13)
    }
}

private fun displayLocation(host: Host): String {
    val cities = listOf(
        "Bengaluru, KA",
        "Coimbatore, TN",
        "Chennai, TN",
        "Delhi, DL",
        "Madurai, TN",
        "Hyderabad, TS",
        "Amritsar, PB"
    )
    return cities[stableIndex(host.uid.ifBlank { host.alias }, cities.size)]
}

private fun sampleQuote(host: Host): String {
    val samples = listOf(
        "Nights are better when someone truly listens.",
        "I walked away from a toxic relationship that broke me.",
        "Soft conversations that bring calm.",
        "Pain is only temporary.",
        "Just need to talk? Let's untangle your thoughts gently.",
        "There's magic in my voice, come find out."
    )
    return samples[stableIndex(host.uid.ifBlank { host.alias }, samples.size)]
}

private fun stableIndex(value: String, size: Int): Int {
    if (size <= 0) return 0
    return (value.hashCode() and Int.MAX_VALUE) % size
}

@Composable
fun DiscoverHostCard(
    host: Host,
    onCallClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val friendooColors = LocalFriendooColors.current
    
    val ringColor = when {
        host.isOnline && host.callStatus == "available" -> SuccessGreen
        host.isOnline && host.callStatus == "busy" -> WarningAmber
        else -> Color.Gray.copy(alpha = 0.5f)
    }

    val presenceText = when {
        host.isOnline && host.callStatus == "available" -> "Online"
        host.isOnline && host.callStatus == "busy" -> "In Call"
        else -> "Offline"
    }
    
    val presenceBgColor = when {
        host.isOnline && host.callStatus == "available" -> SuccessGreen.copy(alpha = 0.15f)
        host.isOnline && host.callStatus == "busy" -> WarningAmber.copy(alpha = 0.15f)
        else -> Color.Gray.copy(alpha = 0.1f)
    }

    val presenceTextColor = when {
        host.isOnline && host.callStatus == "available" -> SuccessGreen
        host.isOnline && host.callStatus == "busy" -> WarningAmber
        else -> friendooColors.textSecondary
    }

    Card(
        onClick = onCallClick,
        modifier = modifier
            .width(175.dp)
            .padding(vertical = 4.dp),
        shape = RoundedCornerShape(24.dp),
        border = androidx.compose.foundation.BorderStroke(
            1.dp, 
            if (host.isOnline && host.callStatus == "available") SuccessGreen.copy(alpha = 0.3f) 
            else friendooColors.border.copy(alpha = 0.5f)
        ),
        colors = CardDefaults.cardColors(
            containerColor = if (host.isOnline && host.callStatus == "available") 
                MaterialTheme.colorScheme.surface 
            else 
                MaterialTheme.colorScheme.surface.copy(alpha = 0.85f)
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = if (host.isOnline && host.callStatus == "available") 6.dp else 2.dp
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.size(86.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(76.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.radialGradient(
                                colors = listOf(ringColor.copy(alpha = 0.3f), Color.Transparent)
                            )
                        )
                )
                
                Box(
                    modifier = Modifier
                        .size(68.dp)
                        .clip(CircleShape)
                        .border(2.5.dp, ringColor, CircleShape)
                        .padding(3.dp),
                    contentAlignment = Alignment.Center
                ) {
                    val context = LocalContext.current
                    val seed = host.avatarSeed.ifBlank { host.uid }
                    val encodedSeed = java.net.URLEncoder.encode(seed, "UTF-8")
                    val avatarUrl = "https://api.dicebear.com/7.x/adventurer/png?seed=$encodedSeed&gender=female"

                    AsyncImage(
                        model = ImageRequest.Builder(context)
                            .data(avatarUrl)
                            .crossfade(true)
                            .build(),
                        contentDescription = host.alias,
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(CircleShape)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Surface(
                color = presenceBgColor,
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.padding(bottom = 6.dp)
            ) {
                Text(
                    text = presenceText,
                    style = MaterialTheme.typography.labelSmall,
                    color = presenceTextColor,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                )
            }

            Text(
                text = host.alias.ifEmpty { "Host" },
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = friendooColors.textPrimary,
                maxLines = 1,
                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
            )

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center,
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(
                    Icons.Default.Star,
                    contentDescription = "Rating",
                    tint = Gold,
                    modifier = Modifier.size(13.dp)
                )
                Text(
                    text = " ${String.format("%.1f", host.avgRating ?: 5.0)}",
                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                    fontWeight = FontWeight.Bold,
                    color = friendooColors.textPrimary
                )
                Text(
                    text = " · ${host.totalCalls} calls",
                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                    color = friendooColors.textSecondary
                )
            }

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = host.languages.joinToString(", "),
                style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                color = Violet,
                fontWeight = FontWeight.Medium,
                maxLines = 1,
                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = host.bio.ifBlank { "Ready for a warm talk!" },
                style = MaterialTheme.typography.bodySmall.copy(fontSize = 12.sp, lineHeight = 14.sp),
                color = friendooColors.textSecondary,
                maxLines = 2,
                minLines = 2,
                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                modifier = Modifier.padding(horizontal = 4.dp)
            )

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Rate",
                        style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp),
                        color = friendooColors.textSecondary
                    )
                    Text(
                        text = "₹${host.ratePerAudioMinute}/m",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.ExtraBold,
                        color = Violet
                    )
                }

                IconButton(
                    onClick = onCallClick,
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(
                            if (host.callStatus == "offline") 
                                Color.Gray.copy(alpha = 0.15f) 
                            else if (host.callStatus == "busy")
                                WarningAmber
                            else
                                Violet
                        )
                ) {
                    Icon(
                        imageVector = Icons.Default.Call,
                        contentDescription = "Call",
                        tint = if (host.callStatus == "offline") friendooColors.textSecondary else PureWhite,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun CoinBalancePill(coins: Int, modifier: Modifier = Modifier, onClick: () -> Unit = {}) {
    Surface(
        modifier = modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(50),
        color = Color(0xFF4F8EF7),
        shadowElevation = 3.dp
    ) {
        Row(
            modifier = Modifier.padding(start = 10.dp, end = 6.dp, top = 6.dp, bottom = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = "$coins coin",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Box(
                modifier = Modifier
                    .size(18.dp)
                    .clip(CircleShape)
                    .background(Color.White),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Default.Add,
                    contentDescription = "Add coins",
                    tint = Color(0xFF4F8EF7),
                    modifier = Modifier.size(13.dp)
                )
            }
        }
    }
}

@Composable
fun DiscoverHostHorizontalCard(
    host: Host,
    onCallClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isAvailable = host.isOnline && host.callStatus == "available"
    val langLabel = when (host.primaryLanguage) {
        "ta" -> "Tamil"
        "hi" -> "Hindi"
        "ml" -> "Malayalam"
        "te" -> "Telugu"
        else -> "English"
    }

    Card(
        onClick = onCallClick,
        modifier = modifier.width(160.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.95f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            ExpertAvatar(host = host, isAvailable = isAvailable)
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = host.alias.ifBlank { "Host" },
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
            )
            Text(
                text = langLabel,
                style = MaterialTheme.typography.labelSmall,
                color = Color(0xFF8A8490)
            )
            Text(
                text = "${host.ratePerAudioMinute} coins/min",
                style = MaterialTheme.typography.labelSmall,
                color = Color(0xFFE05B96),
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(6.dp))
            Surface(
                color = if (isAvailable) Color(0xFFE8F8EE) else Color(0xFFF3F3F5),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = when {
                        isAvailable -> "Online"
                        host.callStatus == "busy" -> "Busy"
                        else -> "Offline"
                    },
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                    style = MaterialTheme.typography.labelSmall,
                    color = if (isAvailable) Color(0xFF1B8A4C) else Color(0xFF8A8490),
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
