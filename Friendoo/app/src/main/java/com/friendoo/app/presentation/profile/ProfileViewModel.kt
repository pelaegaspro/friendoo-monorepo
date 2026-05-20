package com.friendoo.app.presentation.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.friendoo.app.data.local.UserPreferences
import com.friendoo.app.data.model.User
import com.friendoo.app.data.repository.AuthRepository
import com.friendoo.app.data.repository.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class ProfileState {
    object Loading : ProfileState()
    data class Success(val user: User) : ProfileState()
    data class Error(val message: String) : ProfileState()
}

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val userRepository: UserRepository,
    private val authRepository: AuthRepository,
    val userPreferences: UserPreferences
) : ViewModel() {

    private val _state = MutableStateFlow<ProfileState>(ProfileState.Loading)
    val state: StateFlow<ProfileState> = _state

    init {
        loadProfile()
    }

    fun loadProfile() {
        viewModelScope.launch {
            _state.value = ProfileState.Loading
            val uid = userPreferences.userIdFlow.firstOrNull()
            if (uid != null) {
                userRepository.getUserFlow(uid)
                    .catch { e ->
                        _state.value = ProfileState.Error(e.message ?: "Failed to load profile stream")
                    }
                    .collect { user ->
                        _state.value = ProfileState.Success(user)
                    }
            } else {
                _state.value = ProfileState.Error("User ID not found")
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.signOut()
        }
    }
}
