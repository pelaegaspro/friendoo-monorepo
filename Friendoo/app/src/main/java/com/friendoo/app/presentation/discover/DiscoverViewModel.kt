package com.friendoo.app.presentation.discover

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.friendoo.app.data.local.UserPreferences
import com.friendoo.app.data.model.Host
import com.friendoo.app.domain.usecase.GetDiscoverHostsUseCase
import com.friendoo.app.domain.usecase.InitiateCallUseCase
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DiscoverFilters(
    val ageGroup: String? = null,
    val vibeTag: String? = null,
    val starOnly: Boolean = false,
    val onlineOnly: Boolean = false
)

sealed class DiscoverState {
    object Loading : DiscoverState()
    data class Success(
        val allHosts: List<Host>,
        val filteredHosts: List<Host>,
        val filters: DiscoverFilters = DiscoverFilters()
    ) : DiscoverState()
    data class Error(val message: String) : DiscoverState()
}

@HiltViewModel
class DiscoverViewModel @Inject constructor(
    private val getDiscoverHostsUseCase: GetDiscoverHostsUseCase,
    private val initiateCallUseCase: InitiateCallUseCase,
    private val userPreferences: UserPreferences,
    private val firestore: FirebaseFirestore
) : ViewModel() {

    private val _state = MutableStateFlow<DiscoverState>(DiscoverState.Loading)
    val state: StateFlow<DiscoverState> = _state

    private val _coinBalance = MutableStateFlow(0)
    val coinBalance: StateFlow<Int> = _coinBalance
    private var coinBalanceListener: ListenerRegistration? = null

    init {
        loadHosts()
        observeCoinBalance()
    }

    private fun observeCoinBalance() {
        viewModelScope.launch {
            val userId = userPreferences.userIdFlow.first() ?: return@launch
            coinBalanceListener?.remove()
            coinBalanceListener = firestore.collection("users").document(userId)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        return@addSnapshotListener
                    }
                    if (snapshot != null && snapshot.exists()) {
                        val balance = (snapshot.getLong("coinBalance") ?: 0).toInt()
                        _coinBalance.value = balance
                    }
                }
        }
    }

    fun loadHosts() {
        _state.value = DiscoverState.Loading
        viewModelScope.launch {
            val result = getDiscoverHostsUseCase()
            if (result.isSuccess) {
                val hosts = result.getOrDefault(emptyList())
                // Default sorting: Online first -> Avg Rating -> Total Calls
                val sortedHosts = sortHosts(hosts)
                _state.value = DiscoverState.Success(
                    allHosts = sortedHosts,
                    filteredHosts = sortedHosts
                )
            } else {
                _state.value = DiscoverState.Error(result.exceptionOrNull()?.message ?: "Unknown error")
            }
        }
    }

    fun updateFilters(newFilters: DiscoverFilters) {
        val currentState = _state.value
        if (currentState is DiscoverState.Success) {
            val filtered = currentState.allHosts.filter { host ->
                val matchesAge = newFilters.ageGroup == null || host.ageGroup == newFilters.ageGroup
                val matchesVibe = newFilters.vibeTag == null || host.vibeTags?.contains(newFilters.vibeTag) == true
                val matchesStar = !newFilters.starOnly || host.isStarHost == true
                val matchesOnline = !newFilters.onlineOnly || host.isOnline
                matchesAge && matchesVibe && matchesStar && matchesOnline
            }
            _state.value = currentState.copy(
                filteredHosts = sortHosts(filtered),
                filters = newFilters
            )
        }
    }

    private fun sortHosts(hosts: List<Host>): List<Host> {
        return hosts.sortedWith(
            compareByDescending<Host> { host ->
                when {
                    host.isOnline && host.callStatus == "available" -> 3
                    host.isOnline && host.callStatus == "busy" -> 2
                    else -> 1
                }
            }
            .thenByDescending { it.avgRating ?: 5.0 }
            .thenByDescending { it.totalCalls }
        )
    }

    override fun onCleared() {
        coinBalanceListener?.remove()
        super.onCleared()
    }

    fun toggleAgeFilter(ageGroup: String) {
        val currentFilters = (state.value as? DiscoverState.Success)?.filters ?: DiscoverFilters()
        val nextAge = if (currentFilters.ageGroup == ageGroup) null else ageGroup
        updateFilters(currentFilters.copy(ageGroup = nextAge))
    }

    fun toggleVibeFilter(vibe: String) {
        val currentFilters = (state.value as? DiscoverState.Success)?.filters ?: DiscoverFilters()
        val nextVibe = if (currentFilters.vibeTag == vibe) null else vibe
        updateFilters(currentFilters.copy(vibeTag = nextVibe))
    }

    fun toggleStarOnly() {
        val currentFilters = (state.value as? DiscoverState.Success)?.filters ?: DiscoverFilters()
        updateFilters(currentFilters.copy(starOnly = !currentFilters.starOnly))
    }

    fun toggleOnlineOnly() {
        val currentFilters = (state.value as? DiscoverState.Success)?.filters ?: DiscoverFilters()
        updateFilters(currentFilters.copy(onlineOnly = !currentFilters.onlineOnly))
    }
}
