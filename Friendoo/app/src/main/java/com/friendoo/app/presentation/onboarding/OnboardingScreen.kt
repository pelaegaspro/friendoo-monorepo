package com.friendoo.app.presentation.onboarding

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.friendoo.app.presentation.components.FriendooAvatar
import com.friendoo.app.presentation.components.AvatarConfig
import com.friendoo.app.presentation.profile.CustomizerTab
import com.friendoo.app.presentation.profile.HairPanel
import com.friendoo.app.presentation.profile.SkinPanel
import com.friendoo.app.presentation.profile.EyesPanel
import com.friendoo.app.presentation.profile.ClothesPanel
import com.friendoo.app.presentation.profile.AccessoriesPanel
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.material3.BottomSheetDefaults
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import com.friendoo.app.presentation.theme.DarkBackground
import com.friendoo.app.presentation.theme.DarkCard
import com.friendoo.app.presentation.theme.DarkDivider
import com.friendoo.app.presentation.theme.DarkSurface
import com.friendoo.app.presentation.theme.DarkTextPrimary
import com.friendoo.app.presentation.theme.DarkTextSecondary
import com.friendoo.app.presentation.theme.FriendooGradients
import com.friendoo.app.presentation.theme.LightBackground
import com.friendoo.app.presentation.theme.LightCard
import com.friendoo.app.presentation.theme.LightDivider
import com.friendoo.app.presentation.theme.LightSurface
import com.friendoo.app.presentation.theme.LightTextPrimary
import com.friendoo.app.presentation.theme.LightTextSecondary
import com.friendoo.app.presentation.theme.LocalFriendooColors
import com.friendoo.app.presentation.theme.PureWhite
import com.friendoo.app.presentation.theme.RosePink
import com.friendoo.app.presentation.theme.SoftPurple
import com.friendoo.app.presentation.theme.WarmCoral

@Composable
private fun isSystemInDarkTheme(): Boolean = false

@Composable
fun OnboardingScreen(
    viewModel: OnboardingViewModel = hiltViewModel(),
    onComplete: (Boolean) -> Unit
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(state.isComplete) {
        if (state.isComplete) {
            onComplete(state.isHost)
        }
    }

    ProfileSetupScreen(
        state = state,
        onNameChange = viewModel::onDisplayNameChange,
        onAccountTypeChange = viewModel::setAccountType,
        onAvatarSelected = viewModel::selectAvatar,
        onAvatarConfigChanged = viewModel::updateSelectedAvatarConfig,
        onRegenerate = viewModel::regenerateAvatars,
        onContinue = viewModel::completeOnboarding
    )
}

@OptIn(ExperimentalFoundationApi::class, ExperimentalMaterial3Api::class)
@Composable
private fun ProfileSetupScreen(
    state: OnboardingUiState,
    onNameChange: (String) -> Unit,
    onAccountTypeChange: (Boolean) -> Unit,
    onAvatarSelected: (AvatarSuggestion) -> Unit,
    onAvatarConfigChanged: (AvatarConfig) -> Unit,
    onRegenerate: () -> Unit,
    onContinue: () -> Unit
) {
    val colors = LocalFriendooColors.current
    val isDark = isSystemInDarkTheme()
    val focusManager = LocalFocusManager.current
    
    var showBottomSheet by remember { mutableStateOf(false) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    
    val pageBrush = if (isDark) {
        Brush.verticalGradient(listOf(DarkBackground, DarkSurface))
    } else {
        Brush.verticalGradient(listOf(LightBackground, LightSurface))
    }
    val cardColor = if (isDark) DarkCard else LightCard
    val borderColor = if (isDark) DarkDivider else LightDivider

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(pageBrush)
            .navigationBarsPadding()
            .imePadding()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "FRIENDOO",
                style = MaterialTheme.typography.labelLarge,
                color = SoftPurple,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp
            )
            
            Text(
                text = "Welcome to your space",
                style = MaterialTheme.typography.headlineLarge,
                color = colors.textPrimary,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 8.dp)
            )
            
            Text(
                text = "Let's set up a few quick details to customize your experience.",
                style = MaterialTheme.typography.bodyMedium,
                color = colors.textSecondary,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(start = 12.dp, end = 12.dp, top = 8.dp)
            )

            Spacer(modifier = Modifier.height(28.dp))

            // SECTION 1: Display Name
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = cardColor),
                border = BorderStroke(1.dp, borderColor)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "Display Name",
                        style = MaterialTheme.typography.titleMedium,
                        color = colors.textPrimary,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "This is what others will see in call rooms.",
                        style = MaterialTheme.typography.bodySmall,
                        color = colors.textSecondary,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                    OutlinedTextField(
                        value = state.displayName,
                        onValueChange = onNameChange,
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        placeholder = { Text("Enter your name", color = colors.textHint) },
                        shape = RoundedCornerShape(16.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = colors.textPrimary,
                            unfocusedTextColor = colors.textPrimary,
                            focusedContainerColor = if (isDark) DarkSurface else LightSurface,
                            unfocusedContainerColor = if (isDark) DarkSurface else LightSurface,
                            focusedBorderColor = SoftPurple,
                            unfocusedBorderColor = borderColor,
                            cursorColor = SoftPurple
                        ),
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                        keyboardActions = KeyboardActions(onDone = { focusManager.clearFocus() })
                    )
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            // SECTION 2: Role Switcher Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = cardColor),
                border = BorderStroke(1.dp, borderColor)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "Choose Your Role",
                        style = MaterialTheme.typography.titleMedium,
                        color = colors.textPrimary,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Choose your role on Friendoo. This changes your avatar choices.",
                        style = MaterialTheme.typography.bodySmall,
                        color = colors.textSecondary,
                        modifier = Modifier.padding(bottom = 14.dp)
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        // User Card
                        AccountTypeCard(
                            title = "User",
                            subtitle = "Listen & chat",
                            iconText = "💬",
                            selected = !state.isHost,
                            accentColor = SoftPurple,
                            onClick = { onAccountTypeChange(false) },
                            modifier = Modifier.weight(1f)
                        )

                        // Host Card
                        AccountTypeCard(
                            title = "Host",
                            subtitle = "Stream & earn",
                            iconText = "🎙️",
                            selected = state.isHost,
                            accentColor = RosePink,
                            onClick = { onAccountTypeChange(true) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            // SECTION 3: Avatar Selection
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = cardColor),
                border = BorderStroke(1.dp, borderColor)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Select Avatar",
                                style = MaterialTheme.typography.titleMedium,
                                color = colors.textPrimary,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = if (state.isHost) "Female options shown" else "Male options shown",
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.textSecondary
                            )
                        }
                        IconButton(
                            onClick = onRegenerate,
                            modifier = Modifier
                                .clip(CircleShape)
                                .background(if (isDark) DarkSurface else LightSurface)
                                .border(1.dp, borderColor, CircleShape)
                                .size(36.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Refresh,
                                contentDescription = "Regenerate options",
                                tint = if (state.isHost) RosePink else SoftPurple,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    AnimatedContent(
                        targetState = state.avatars,
                        label = "avatar_grid"
                    ) { avatars ->
                        LazyVerticalGrid(
                            columns = GridCells.Fixed(4),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(190.dp),
                            userScrollEnabled = false,
                            contentPadding = PaddingValues(2.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(avatars, key = { it.seed }) { avatar ->
                                AvatarTile(
                                    avatar = avatar,
                                    selected = avatar.seed == state.selectedAvatar?.seed,
                                    accentColor = if (state.isHost) RosePink else SoftPurple,
                                    onClick = { onAvatarSelected(avatar) },
                                    modifier = Modifier.animateItemPlacement()
                                )
                            }
                        }
                    }

                    if (state.selectedAvatar != null) {
                        Spacer(modifier = Modifier.height(14.dp))
                        androidx.compose.material3.OutlinedButton(
                            onClick = { showBottomSheet = true },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            border = BorderStroke(
                                1.5.dp,
                                if (state.isHost) RosePink.copy(alpha = 0.6f) else SoftPurple.copy(alpha = 0.6f)
                            ),
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = if (state.isHost) RosePink else SoftPurple
                            )
                        ) {
                            Text(
                                text = "🎨 Customize Selected Avatar",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
            }

            if (state.error != null) {
                Text(
                    text = state.error,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(top = 16.dp)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            GradientContinueButton(
                enabled = !state.isProfileLoading && state.displayName.trim().length >= 2 && state.selectedAvatar != null,
                loading = state.isLoading,
                onClick = onContinue
            )

            Spacer(modifier = Modifier.height(24.dp))
        }

        if (showBottomSheet && state.selectedAvatar != null) {
            ModalBottomSheet(
                onDismissRequest = { showBottomSheet = false },
                sheetState = sheetState,
                containerColor = if (isDark) DarkCard else LightCard,
                contentColor = colors.textPrimary,
                dragHandle = { BottomSheetDefaults.DragHandle(color = colors.textSecondary.copy(alpha = 0.4f)) }
            ) {
                var activeTab by remember { mutableStateOf(CustomizerTab.Hair) }
                val activeConfig = state.selectedAvatar.config
                val seed = state.selectedAvatar.seed

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 24.dp)
                        .navigationBarsPadding(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Customize Your Avatar",
                        style = MaterialTheme.typography.titleLarge,
                        color = colors.textPrimary,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )

                    // Circle preview with subtle neon gradient backing
                    Box(
                        modifier = Modifier
                            .size(120.dp)
                            .clip(CircleShape)
                            .background(
                                Brush.radialGradient(
                                    colors = listOf(
                                        if (state.isHost) RosePink.copy(alpha = 0.2f) else SoftPurple.copy(alpha = 0.2f),
                                        Color.Transparent
                                    )
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        FriendooAvatar(
                            avatarSeed = seed,
                            avatarUrl = state.selectedAvatar.url,
                            size = 100.dp
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Scrollable category tabs
                    ScrollableTabRow(
                        selectedTabIndex = activeTab.ordinal,
                        containerColor = Color.Transparent,
                        contentColor = if (state.isHost) RosePink else SoftPurple,
                        edgePadding = 16.dp,
                        divider = {},
                        indicator = { tabPositions ->
                            TabRowDefaults.Indicator(
                                modifier = Modifier.tabIndicatorOffset(tabPositions[activeTab.ordinal]),
                                color = if (state.isHost) RosePink else SoftPurple,
                                height = 3.dp
                            )
                        }
                    ) {
                        CustomizerTab.values().forEach { tab ->
                            Tab(
                                selected = activeTab == tab,
                                onClick = { activeTab = tab },
                                text = {
                                    Text(
                                        text = tab.name,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp
                                    )
                                },
                                selectedContentColor = if (state.isHost) RosePink else SoftPurple,
                                unselectedContentColor = colors.textSecondary
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Panel content
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(180.dp)
                            .padding(horizontal = 20.dp)
                    ) {
                        when (activeTab) {
                            CustomizerTab.Hair -> HairPanel(
                                config = activeConfig,
                                isHost = state.isHost,
                                onUpdate = onAvatarConfigChanged
                            )
                            CustomizerTab.Skin -> SkinPanel(
                                config = activeConfig,
                                onUpdate = onAvatarConfigChanged
                            )
                            CustomizerTab.Eyes -> EyesPanel(
                                config = activeConfig,
                                onUpdate = onAvatarConfigChanged
                            )
                            CustomizerTab.Clothes -> ClothesPanel(
                                config = activeConfig,
                                onUpdate = onAvatarConfigChanged
                            )
                            CustomizerTab.Accessories -> AccessoriesPanel(
                                config = activeConfig,
                                onUpdate = onAvatarConfigChanged
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Done Button
                    Button(
                        onClick = { showBottomSheet = false },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 24.dp)
                            .height(48.dp),
                        shape = RoundedCornerShape(24.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (state.isHost) RosePink else SoftPurple
                        )
                    ) {
                        Text(
                            text = "Looks Good!",
                            color = PureWhite,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun AccountTypeCard(
    title: String,
    subtitle: String,
    iconText: String,
    selected: Boolean,
    accentColor: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isDark = isSystemInDarkTheme()
    val scale by animateFloatAsState(
        targetValue = if (selected) 1.03f else 1f,
        label = "account_type_scale"
    )
    val cardBorderColor by animateColorAsState(
        targetValue = if (selected) accentColor else if (isDark) DarkDivider else LightDivider,
        label = "account_type_border"
    )
    val cardBgColor = if (selected) {
        accentColor.copy(alpha = if (isDark) 0.12f else 0.06f)
    } else {
        if (isDark) DarkSurface else LightSurface
    }

    Box(
        modifier = modifier
            .scale(scale)
            .clip(RoundedCornerShape(20.dp))
            .background(cardBgColor)
            .border(
                border = BorderStroke(if (selected) 2.dp else 1.dp, cardBorderColor),
                shape = RoundedCornerShape(20.dp)
            )
            .clickable(onClick = onClick)
            .padding(vertical = 16.dp, horizontal = 12.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = iconText,
                fontSize = 32.sp,
                modifier = Modifier.padding(bottom = 6.dp)
            )
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = if (selected) accentColor else if (isDark) DarkTextPrimary else LightTextPrimary
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                color = if (isDark) DarkTextSecondary else LightTextSecondary,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun AvatarTile(
    avatar: AvatarSuggestion,
    selected: Boolean,
    accentColor: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val scale by animateFloatAsState(
        targetValue = if (selected) 1.05f else 1f,
        label = "avatar_tile_scale"
    )
    val borderColor by animateColorAsState(
        targetValue = if (selected) accentColor else Color.Transparent,
        label = "avatar_tile_border"
    )

    Box(
        modifier = modifier
            .aspectRatio(1f)
            .scale(scale)
            .clip(RoundedCornerShape(20.dp))
            .background(if (isSystemInDarkTheme()) DarkSurface else LightSurface)
            .border(if (selected) 2.5.dp else 0.dp, borderColor, RoundedCornerShape(20.dp))
            .clickable(onClick = onClick)
            .padding(6.dp),
        contentAlignment = Alignment.Center
    ) {
        AsyncImage(
            model = avatar.url,
            contentDescription = "Avatar option",
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .fillMaxSize()
                .clip(CircleShape)
                .background(if (isSystemInDarkTheme()) DarkCard else LightCard)
        )

        if (selected) {
            Surface(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .size(20.dp),
                shape = CircleShape,
                color = accentColor
            ) {
                Icon(
                    imageVector = Icons.Default.Check,
                    contentDescription = null,
                    tint = PureWhite,
                    modifier = Modifier.padding(4.dp)
                )
            }
        }
    }
}

@Composable
private fun GradientContinueButton(
    enabled: Boolean,
    loading: Boolean,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        enabled = enabled && !loading,
        shape = RoundedCornerShape(24.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = Color.Transparent,
            disabledContainerColor = if (isSystemInDarkTheme()) DarkCard else LightCard
        ),
        contentPadding = PaddingValues(),
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    if (enabled) FriendooGradients.primaryHorizontal
                    else Brush.horizontalGradient(
                        listOf(
                            if (isSystemInDarkTheme()) DarkDivider else LightDivider,
                            if (isSystemInDarkTheme()) DarkDivider else LightDivider
                        )
                    )
                ),
            contentAlignment = Alignment.Center
        ) {
            if (loading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = PureWhite,
                    strokeWidth = 2.dp
                )
            } else {
                Text(
                    text = "Create Profile",
                    color = if (enabled) PureWhite else if (isSystemInDarkTheme()) DarkTextSecondary else LightTextSecondary,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
