package com.friendoo.app.presentation.onboarding

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.friendoo.app.data.local.UserPreferences
import com.friendoo.app.presentation.components.AvatarConfig
import com.friendoo.app.data.remote.api.InsForgeAuthSource
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.SetOptions
import dagger.hilt.android.lifecycle.HiltViewModel
import java.net.URLEncoder
import java.util.UUID
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

data class AvatarSuggestion(
    val seed: String,
    val config: AvatarConfig,
    val url: String
)

data class OnboardingUiState(
    val uid: String = "",
    val displayName: String = "",
    val isHost: Boolean = false,
    val accountType: String = "user",
    val avatars: List<AvatarSuggestion> = emptyList(),
    val selectedAvatar: AvatarSuggestion? = null,
    val isComplete: Boolean = false,
    val isLoading: Boolean = false,
    val isProfileLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class OnboardingViewModel @Inject constructor(
    private val userPreferences: UserPreferences,
    private val firestore: FirebaseFirestore,
    private val authSource: InsForgeAuthSource
) : ViewModel() {

    private val _state = MutableStateFlow(OnboardingUiState())
    val state: StateFlow<OnboardingUiState> = _state

    private var userListener: ListenerRegistration? = null

    init {
        val uid = authSource.getCurrentUser()?.uid.orEmpty()
        _state.value = _state.value.copy(uid = uid)
        generateAvatarSet()
        observeLoggedInProfile(uid)
    }

    override fun onCleared() {
        userListener?.remove()
        super.onCleared()
    }

    fun onDisplayNameChange(value: String) {
        _state.value = _state.value.copy(
            displayName = value.take(32),
            error = null
        )
    }

    fun setAccountType(isHost: Boolean) {
        val current = _state.value
        _state.value = current.copy(
            isHost = isHost,
            accountType = if (isHost) "host" else "user",
            error = null
        )
        generateAvatarSet()
    }

    fun selectAvatar(avatar: AvatarSuggestion) {
        _state.value = _state.value.copy(selectedAvatar = avatar, error = null)
    }

    fun regenerateAvatars() {
        generateAvatarSet()
    }

    fun completeOnboarding() {
        val current = _state.value
        val userId = authSource.getCurrentUser()?.uid
        val displayName = current.displayName.trim()
        val avatar = current.selectedAvatar

        when {
            userId.isNullOrBlank() -> {
                _state.value = current.copy(error = "Please login again to continue.")
                return
            }
            displayName.length < 2 -> {
                _state.value = current.copy(error = "Enter a display name.")
                return
            }
            avatar == null -> {
                _state.value = current.copy(error = "Choose an avatar.")
                return
            }
        }

        val safeUserId: String = userId ?: return
        val selectedAvatar: AvatarSuggestion = avatar ?: return
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                val accountType = if (_state.value.isHost) "host" else "user"
                val data = mapOf(
                    "uid" to safeUserId,
                    "displayName" to displayName,
                    "alias" to displayName,
                    "accountType" to accountType,
                    "isHost" to _state.value.isHost,
                    "gender" to if (_state.value.isHost) "female" else "male",
                    "avatarSeed" to selectedAvatar.seed,
                    "avatarUrl" to selectedAvatar.url,
                    "avatarConfig" to selectedAvatar.config.toMap(),
                    "avatarVersion" to 1,
                    "onboardingCompleted" to true,
                    "onboardingComplete" to true,
                    "updatedAt" to FieldValue.serverTimestamp(),
                    "createdAt" to FieldValue.serverTimestamp()
                )

                firestore.collection("users")
                    .document(safeUserId)
                    .set(data, SetOptions.merge())
                    .await()

                if (_state.value.isHost) {
                    val hostData = mapOf(
                        "uid" to safeUserId,
                        "alias" to displayName,
                        "avatarSeed" to selectedAvatar.seed,
                        "avatarUrl" to selectedAvatar.url,
                        "avatarConfig" to selectedAvatar.config.toMap(),
                        "avatarVersion" to 1,
                        "gender" to "female",
                        "onboardingCompleted" to true,
                        "onboardingComplete" to true,
                        "isOnline" to false,
                        "callStatus" to "offline",
                        "updatedAt" to FieldValue.serverTimestamp(),
                        "createdAt" to FieldValue.serverTimestamp()
                    )
                    firestore.collection("hosts")
                        .document(safeUserId)
                        .set(hostData, SetOptions.merge())
                        .await()
                }

                userPreferences.saveUserId(safeUserId)
                userPreferences.setIsHost(_state.value.isHost)
                userPreferences.setOnboardingCompleted(true)
                _state.value = _state.value.copy(isComplete = true, isLoading = false)
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = e.message ?: "Failed to create your profile."
                )
            }
        }
    }

    private fun observeLoggedInProfile(uid: String) {
        if (uid.isBlank()) {
            _state.value = _state.value.copy(isProfileLoading = false)
            return
        }

        userListener = firestore.collection("users").document(uid)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    _state.value = _state.value.copy(
                        isProfileLoading = false,
                        error = error.message ?: "Failed to load profile details."
                    )
                    return@addSnapshotListener
                }

                val data = snapshot?.data.orEmpty()
                val isHost = data["isHost"] as? Boolean
                    ?: (data["accountType"] as? String).equals("host", ignoreCase = true)
                val accountType = if (isHost) "host" else "user"
                val completed = data["onboardingCompleted"] as? Boolean
                    ?: data["onboardingComplete"] as? Boolean
                    ?: false
                val remoteDisplayName = data["displayName"] as? String
                    ?: data["alias"] as? String
                    ?: authSource.getCurrentUser()?.phoneNumber
                    ?: ""

                _state.value = _state.value.copy(
                    displayName = _state.value.displayName.ifBlank { remoteDisplayName },
                    isHost = isHost,
                    accountType = accountType,
                    isProfileLoading = false
                )

                viewModelScope.launch {
                    userPreferences.setIsHost(isHost)
                    if (completed) {
                        userPreferences.setOnboardingCompleted(true)
                        _state.value = _state.value.copy(isComplete = true)
                    }
                }

                val gender = if (isHost) "female" else "male"
                if (_state.value.avatars.firstOrNull()?.url?.contains("gender=$gender") != true) {
                    generateAvatarSet()
                }
            }
    }

    fun updateSelectedAvatarConfig(newConfig: AvatarConfig) {
        val current = _state.value
        val selected = current.selectedAvatar ?: return
        val updatedUrl = newConfig.buildUrl(selected.seed)
        val updatedAvatar = selected.copy(
            config = newConfig,
            url = updatedUrl
        )
        _state.value = current.copy(
            selectedAvatar = updatedAvatar,
            error = null
        )
    }

    private fun generateAvatarSet(count: Int = 8) {
        val current = _state.value
        val baseName = current.displayName
            .trim()
            .ifBlank { if (current.isHost) "Anna" else "John" }
            .replace(Regex("\\s+"), "-")

        val avatars = List(count) { index ->
            val seed = "$baseName-${UUID.randomUUID()}-$index"
            val config = AvatarConfig.generateRandom(current.isHost)
            AvatarSuggestion(
                seed = seed,
                config = config,
                url = config.buildUrl(seed)
            )
        }

        _state.value = current.copy(
            avatars = avatars,
            selectedAvatar = avatars.firstOrNull(),
            error = null
        )
    }
}
