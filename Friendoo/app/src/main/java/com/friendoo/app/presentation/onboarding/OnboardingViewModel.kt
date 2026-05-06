package com.friendoo.app.presentation.onboarding

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.friendoo.app.core.utils.AnonymityUtils
import com.friendoo.app.data.local.UserPreferences
import com.friendoo.app.data.remote.firebase.FirestoreSource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

data class OnboardingUiState(
    val alias: String = AnonymityUtils.generateAnonymousAlias(),
    val avatarColor: String = AnonymityUtils.getRandomColorHex(),
    val isComplete: Boolean = false,
    val isLoading: Boolean = false,
    val showConsentScreen: Boolean = true, // Start with consent
    val hasConsented: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class OnboardingViewModel @Inject constructor(
    private val firestoreSource: FirestoreSource,
    private val userPreferences: UserPreferences
) : ViewModel() {

    private val _state = MutableStateFlow(OnboardingUiState())
    val state: StateFlow<OnboardingUiState> = _state

    init {
        viewModelScope.launch {
            val alreadyConsented = userPreferences.consentGivenFlow.first()
            if (alreadyConsented) {
                _state.value = _state.value.copy(showConsentScreen = false, hasConsented = true)
            }
        }
    }

    fun onAcceptConsent() {
        viewModelScope.launch {
            userPreferences.saveConsentGiven(true)
            _state.value = _state.value.copy(showConsentScreen = false, hasConsented = true)
        }
    }

    fun generateNewAlias() {
        _state.value = _state.value.copy(
            alias = AnonymityUtils.generateAnonymousAlias(),
            avatarColor = AnonymityUtils.getRandomColorHex()
        )
    }

    fun completeOnboarding() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            val userId = userPreferences.userIdFlow.first()
            if (userId != null) {
                val result = firestoreSource.updateUser(
                    userId, 
                    mapOf(
                        "alias" to _state.value.alias,
                        "avatarColor" to _state.value.avatarColor,
                        "onboardingComplete" to true,
                        "consentGiven" to _state.value.hasConsented,
                        "consentTimestamp" to com.google.firebase.Timestamp.now()
                    )
                )
                if (result.isSuccess) {
                    userPreferences.setOnboardingCompleted(true)
                    _state.value = _state.value.copy(isComplete = true, isLoading = false)
                } else {
                    _state.value = _state.value.copy(
                        isLoading = false, 
                        error = result.exceptionOrNull()?.message ?: "Failed to save profile"
                    )
                }
            } else {
                _state.value = _state.value.copy(isLoading = false, error = "User not found")
            }
        }
    }
}
