package com.friendoo.app.presentation.profile

import android.net.Uri
import androidx.compose.animation.*
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
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
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.friendoo.app.data.local.UserPreferences
import com.friendoo.app.data.model.User
import com.friendoo.app.data.repository.UserRepository
import com.friendoo.app.presentation.components.AvatarConfig
import com.friendoo.app.presentation.components.AvatarSize
import com.friendoo.app.presentation.components.FriendooAvatar
import com.friendoo.app.presentation.theme.*
import com.friendoo.app.data.remote.api.InsForgeAuthSource
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

data class AvatarPickerUiState(
    val isLoading: Boolean = true,
    val isSaving: Boolean = false,
    val user: User? = null,
    val activeConfig: AvatarConfig = AvatarConfig(),
    val seed: String = "",
    val isHost: Boolean = false,
    val error: String? = null,
    val isSaved: Boolean = false
)

@HiltViewModel
class AvatarPickerViewModel @Inject constructor(
    private val userRepository: UserRepository,
    private val authSource: InsForgeAuthSource,
    private val firestore: FirebaseFirestore,
    private val userPreferences: UserPreferences
) : ViewModel() {

    private val _state = MutableStateFlow(AvatarPickerUiState())
    val state: StateFlow<AvatarPickerUiState> = _state

    init {
        loadUserProfile()
    }

    private fun loadUserProfile() {
        val uid = authSource.getCurrentUser()?.uid.orEmpty()
        if (uid.isBlank()) {
            _state.value = _state.value.copy(isLoading = false, error = "User not logged in.")
            return
        }

        viewModelScope.launch {
            try {
                userRepository.getUser(uid).onSuccess { user ->
                    val isHost = user.isHost
                    val config = AvatarConfig.fromMap(user.avatarConfig)
                    
                    val activeConfig = if (config.top.isEmpty()) {
                        AvatarConfig.generateRandom(isHost)
                    } else config

                    _state.value = _state.value.copy(
                        isLoading = false,
                        user = user,
                        activeConfig = activeConfig,
                        seed = user.avatarSeed.ifBlank { uid },
                        isHost = isHost
                    )
                }.onFailure { e ->
                    _state.value = _state.value.copy(isLoading = false, error = e.message ?: "Failed to load profile details.")
                }
            } catch (e: Exception) {
                _state.value = _state.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    fun updateConfig(newConfig: AvatarConfig) {
        _state.value = _state.value.copy(activeConfig = newConfig)
    }

    fun randomize() {
        val current = _state.value
        val randomConfig = AvatarConfig.generateRandom(current.isHost)
        _state.value = current.copy(activeConfig = randomConfig)
    }

    fun saveAvatar() {
        val current = _state.value
        val uid = authSource.getCurrentUser()?.uid ?: return
        
        viewModelScope.launch {
            _state.value = _state.value.copy(isSaving = true, error = null)
            try {
                val newConfig = current.activeConfig
                val newUrl = newConfig.buildUrl(current.seed)

                val updates = mapOf(
                    "avatarConfig" to newConfig.toMap(),
                    "avatarUrl" to newUrl,
                    "avatarVersion" to (current.user?.avatarVersion?.plus(1) ?: 1)
                )

                firestore.collection("users").document(uid)
                    .set(updates, SetOptions.merge())
                    .await()

                if (current.isHost) {
                    firestore.collection("hosts").document(uid)
                        .set(updates, SetOptions.merge())
                        .await()
                }

                _state.value = _state.value.copy(isSaving = false, isSaved = true)
            } catch (e: Exception) {
                _state.value = _state.value.copy(isSaving = false, error = e.message ?: "Failed to save avatar.")
            }
        }
    }
}

enum class CustomizerTab {
    Hair, Skin, Eyes, Clothes, Accessories
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AvatarPickerScreen(
    avatarSeed: String,
    onBack: () -> Unit,
    viewModel: AvatarPickerViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val colors = LocalFriendooColors.current
    val isDark = isSystemInDarkTheme()

    var activeTab by remember { mutableStateOf(CustomizerTab.Hair) }

    LaunchedEffect(state.isSaved) {
        if (state.isSaved) {
            onBack()
        }
    }

    val pageBrush = if (isDark) {
        Brush.verticalGradient(listOf(DarkBackground, DarkSurface))
    } else {
        Brush.verticalGradient(listOf(LightBackground, LightSurface))
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Customize Avatar", color = PureWhite, fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Midnight),
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = PureWhite)
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.randomize() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Shuffle", tint = PureWhite)
                    }
                }
            )
        }
    ) { padding ->
        if (state.isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(pageBrush)
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = SoftPurple)
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(pageBrush)
                    .padding(padding)
            ) {
                // Large Live Preview Panel
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(0.42f)
                        .background(
                            Brush.verticalGradient(
                                listOf(Midnight, MidnightDeep)
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    // Modern soft decorative circles
                    Box(
                        modifier = Modifier
                            .size(240.dp)
                            .clip(CircleShape)
                            .background(
                                Brush.radialGradient(
                                    colors = listOf(
                                        if (state.isHost) RosePink.copy(alpha = 0.25f) else SoftPurple.copy(alpha = 0.25f),
                                        Color.Transparent
                                    )
                                )
                            )
                    )

                    FriendooAvatar(
                        avatarSeed = state.seed,
                        avatarUrl = state.activeConfig.buildUrl(state.seed, size = 512),
                        size = 180.dp,
                        modifier = Modifier.scale(1.1f)
                    )
                }

                // Control customization Deck
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(0.58f),
                    shape = RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp),
                    colors = CardDefaults.cardColors(containerColor = if (isDark) DarkCard else LightCard),
                    border = BorderStroke(1.dp, if (isDark) DarkDivider else LightDivider)
                ) {
                    Column(modifier = Modifier.fillMaxSize()) {
                        // Category Selection Tab Bar
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
                                            fontSize = 14.sp
                                        )
                                    },
                                    selectedContentColor = if (state.isHost) RosePink else SoftPurple,
                                    unselectedContentColor = colors.textSecondary
                                )
                            }
                        }

                        // Options Grid Section
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxWidth()
                                .padding(horizontal = 20.dp, vertical = 12.dp)
                        ) {
                            when (activeTab) {
                                CustomizerTab.Hair -> HairPanel(
                                    config = state.activeConfig,
                                    isHost = state.isHost,
                                    onUpdate = viewModel::updateConfig
                                )
                                CustomizerTab.Skin -> SkinPanel(
                                    config = state.activeConfig,
                                    onUpdate = viewModel::updateConfig
                                )
                                CustomizerTab.Eyes -> EyesPanel(
                                    config = state.activeConfig,
                                    onUpdate = viewModel::updateConfig
                                )
                                CustomizerTab.Clothes -> ClothesPanel(
                                    config = state.activeConfig,
                                    onUpdate = viewModel::updateConfig
                                )
                                CustomizerTab.Accessories -> AccessoriesPanel(
                                    config = state.activeConfig,
                                    onUpdate = viewModel::updateConfig
                                )
                            }
                        }

                        if (state.error != null) {
                            Text(
                                text = state.error!!,
                                color = MaterialTheme.colorScheme.error,
                                fontSize = 12.sp,
                                textAlign = TextAlign.Center,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 20.dp)
                            )
                        }

                        // Save Actions Row
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 24.dp, vertical = 16.dp)
                        ) {
                            Button(
                                onClick = { viewModel.saveAvatar() },
                                enabled = !state.isSaving,
                                shape = RoundedCornerShape(24.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color.Transparent,
                                    disabledContainerColor = if (isDark) DarkSurface else LightSurface
                                ),
                                contentPadding = PaddingValues(),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(52.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .background(
                                            Brush.horizontalGradient(
                                                if (state.isHost) listOf(RosePink, WarmCoral)
                                                else listOf(SoftPurple, RosePink)
                                            )
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (state.isSaving) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.size(24.dp),
                                            color = PureWhite,
                                            strokeWidth = 2.dp
                                        )
                                    } else {
                                        Text(
                                            "Save Avatar",
                                            color = PureWhite,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 16.sp
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

@Composable
fun HairPanel(
    config: AvatarConfig,
    isHost: Boolean,
    onUpdate: (AvatarConfig) -> Unit
) {
    val itemsList = if (isHost) AvatarConfig.femaleTops else AvatarConfig.maleTops
    val isDark = isSystemInDarkTheme()

    Column(modifier = Modifier.fillMaxSize()) {
        Text(
            "Hair Style",
            fontWeight = FontWeight.SemiBold,
            fontSize = 13.sp,
            color = LocalFriendooColors.current.textSecondary,
            modifier = Modifier.padding(bottom = 6.dp)
        )

        LazyRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(vertical = 4.dp)
        ) {
            items(itemsList) { hair ->
                val selected = config.top == hair
                val border = if (selected) BorderStroke(2.dp, if (isHost) RosePink else SoftPurple) else BorderStroke(1.dp, if (isDark) DarkDivider else LightDivider)
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (selected) (if (isHost) RosePink.copy(alpha = 0.1f) else SoftPurple.copy(alpha = 0.1f)) else if (isDark) DarkSurface else LightSurface)
                        .border(border, RoundedCornerShape(12.dp))
                        .clickable { onUpdate(config.copy(top = hair)) }
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = hair.replace("short", "Short ").replace("long", "Long ").replace("Hair", ""),
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        color = if (selected) (if (isHost) RosePink else SoftPurple) else LocalFriendooColors.current.textPrimary
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        Text(
            "Hair Color",
            fontWeight = FontWeight.SemiBold,
            fontSize = 13.sp,
            color = LocalFriendooColors.current.textSecondary,
            modifier = Modifier.padding(bottom = 6.dp)
        )

        ColorSwatchRow(
            colors = AvatarConfig.topColors,
            selectedColor = config.topColor,
            isHost = isHost,
            onColorSelect = { onUpdate(config.copy(topColor = it)) }
        )
    }
}

@Composable
fun SkinPanel(
    config: AvatarConfig,
    onUpdate: (AvatarConfig) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        Text(
            "Skin Tone",
            fontWeight = FontWeight.SemiBold,
            fontSize = 13.sp,
            color = LocalFriendooColors.current.textSecondary,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        ColorSwatchRow(
            colors = AvatarConfig.skinColors,
            selectedColor = config.skinColor,
            isHost = false,
            onColorSelect = { onUpdate(config.copy(skinColor = it)) }
        )
    }
}

@Composable
fun EyesPanel(
    config: AvatarConfig,
    onUpdate: (AvatarConfig) -> Unit
) {
    val eyes = AvatarConfig.eyesList
    val isDark = isSystemInDarkTheme()

    Column(modifier = Modifier.fillMaxSize()) {
        Text(
            "Eye Expression",
            fontWeight = FontWeight.SemiBold,
            fontSize = 13.sp,
            color = LocalFriendooColors.current.textSecondary,
            modifier = Modifier.padding(bottom = 6.dp)
        )

        LazyVerticalGrid(
            columns = GridCells.Fixed(3),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(eyes) { eye ->
                val selected = config.eyes == eye
                val border = if (selected) BorderStroke(2.dp, SoftPurple) else BorderStroke(1.dp, if (isDark) DarkDivider else LightDivider)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(if (selected) SoftPurple.copy(alpha = 0.1f) else if (isDark) DarkSurface else LightSurface)
                        .border(border, RoundedCornerShape(14.dp))
                        .clickable { onUpdate(config.copy(eyes = eye)) }
                        .padding(vertical = 12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        eye.capitalize(),
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        color = if (selected) SoftPurple else LocalFriendooColors.current.textPrimary
                    )
                }
            }
        }
    }
}

@Composable
fun ClothesPanel(
    config: AvatarConfig,
    onUpdate: (AvatarConfig) -> Unit
) {
    val clothings = AvatarConfig.clothings
    val isDark = isSystemInDarkTheme()

    Column(modifier = Modifier.fillMaxSize()) {
        Text(
            "Outfit Style",
            fontWeight = FontWeight.SemiBold,
            fontSize = 13.sp,
            color = LocalFriendooColors.current.textSecondary,
            modifier = Modifier.padding(bottom = 6.dp)
        )

        LazyRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(vertical = 4.dp)
        ) {
            items(clothings) { outfit ->
                val selected = config.clothing == outfit
                val border = if (selected) BorderStroke(2.dp, SoftPurple) else BorderStroke(1.dp, if (isDark) DarkDivider else LightDivider)
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (selected) SoftPurple.copy(alpha = 0.1f) else if (isDark) DarkSurface else LightSurface)
                        .border(border, RoundedCornerShape(12.dp))
                        .clickable { onUpdate(config.copy(clothing = outfit)) }
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        outfit.capitalize().replace("shirt", "Shirt ").replace("blazer", "Blazer "),
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        color = if (selected) SoftPurple else LocalFriendooColors.current.textPrimary
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        Text(
            "Outfit Color",
            fontWeight = FontWeight.SemiBold,
            fontSize = 13.sp,
            color = LocalFriendooColors.current.textSecondary,
            modifier = Modifier.padding(bottom = 6.dp)
        )

        ColorSwatchRow(
            colors = AvatarConfig.clothingColors,
            selectedColor = config.clothingColor,
            isHost = false,
            onColorSelect = { onUpdate(config.copy(clothingColor = it)) }
        )
    }
}

@Composable
fun AccessoriesPanel(
    config: AvatarConfig,
    onUpdate: (AvatarConfig) -> Unit
) {
    val items = AvatarConfig.accessoriesList
    val isDark = isSystemInDarkTheme()

    Column(modifier = Modifier.fillMaxSize()) {
        Text(
            "Glasses & Eye Wear",
            fontWeight = FontWeight.SemiBold,
            fontSize = 13.sp,
            color = LocalFriendooColors.current.textSecondary,
            modifier = Modifier.padding(bottom = 6.dp)
        )

        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(items) { item ->
                val selected = config.accessories == item
                val label = when (item) {
                    "blank" -> "None"
                    "prescription01" -> "Standard Glasses"
                    "prescription02" -> "Retro Frames"
                    "round" -> "Round Glasses"
                    "wayfarers" -> "Wayfarers"
                    else -> "Sunglasses"
                }
                val border = if (selected) BorderStroke(2.dp, SoftPurple) else BorderStroke(1.dp, if (isDark) DarkDivider else LightDivider)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(if (selected) SoftPurple.copy(alpha = 0.1f) else if (isDark) DarkSurface else LightSurface)
                        .border(border, RoundedCornerShape(14.dp))
                        .clickable { onUpdate(config.copy(accessories = item)) }
                        .padding(vertical = 14.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        label,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        color = if (selected) SoftPurple else LocalFriendooColors.current.textPrimary
                    )
                }
            }
        }
    }
}

@Composable
fun ColorSwatchRow(
    colors: List<String>,
    selectedColor: String,
    isHost: Boolean,
    onColorSelect: (String) -> Unit
) {
    LazyRow(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        contentPadding = PaddingValues(vertical = 6.dp)
    ) {
        items(colors) { hex ->
            val color = Color(android.graphics.Color.parseColor("#$hex"))
            val selected = selectedColor == hex

            val scale by animateFloatAsState(
                targetValue = if (selected) 1.15f else 1f,
                label = "color_scale"
            )

            Box(
                modifier = Modifier
                    .size(38.dp)
                    .scale(scale)
                    .clip(CircleShape)
                    .background(color)
                    .border(
                        BorderStroke(
                            width = if (selected) 3.dp else 1.dp,
                            color = if (selected) (if (isHost) RosePink else SoftPurple) else Color.White.copy(alpha = 0.4f)
                        ),
                        CircleShape
                    )
                    .clickable { onColorSelect(hex) },
                contentAlignment = Alignment.Center
            ) {
                if (selected) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = "Selected",
                        tint = if (hex.lowercase() in listOf("ffffff", "e6e6e6", "ecdcbf")) Color.Black else Color.White,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}
