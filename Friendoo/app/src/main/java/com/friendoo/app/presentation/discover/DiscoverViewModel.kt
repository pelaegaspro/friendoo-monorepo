package com.friendoo.app.presentation.discover

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.friendoo.app.data.local.UserPreferences
import com.friendoo.app.data.model.Host
import com.friendoo.app.domain.usecase.GetDiscoverHostsUseCase
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

data class LanguageSection(
    val code: String,
    val title: String,
    val hosts: List<Host>
)

sealed class DiscoverState {
    object Loading : DiscoverState()
    data class Success(
        val sections: List<LanguageSection>,
        val allHosts: List<Host>,
        val filteredHosts: List<Host>,
        val filters: DiscoverFilters = DiscoverFilters()
    ) : DiscoverState()
    data class Error(val message: String) : DiscoverState()
}

@HiltViewModel
class DiscoverViewModel @Inject constructor(
    private val getDiscoverHostsUseCase: GetDiscoverHostsUseCase,
    private val userPreferences: UserPreferences,
    private val firestore: FirebaseFirestore
) : ViewModel() {

    private val _state = MutableStateFlow<DiscoverState>(DiscoverState.Loading)
    val state: StateFlow<DiscoverState> = _state

    private val _coinBalance = MutableStateFlow(0)
    val coinBalance: StateFlow<Int> = _coinBalance
    private var coinBalanceListener: ListenerRegistration? = null

    private val languageTitles = mapOf(
        "ta" to "Tamil Hosts",
        "en" to "English Hosts",
        "hi" to "Hindi Hosts",
        "ml" to "Malayalam Hosts",
        "te" to "Telugu Hosts"
    )

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
                    if (error != null) return@addSnapshotListener
                    if (snapshot != null && snapshot.exists()) {
                        _coinBalance.value = (snapshot.getLong("coinBalance") ?: 0L).toInt()
                    }
                }
        }
    }

    fun loadHosts() {
        _state.value = DiscoverState.Loading
        viewModelScope.launch {
            val result = getDiscoverHostsUseCase.allLanguages()
            if (result.isSuccess) {
                val byLang = result.getOrDefault(emptyMap())
                val allHosts = byLang.values.flatten().distinctBy { it.uid }
                val sections = languageTitles.mapNotNull { (code, title) ->
                    val hosts = sortHosts(byLang[code].orEmpty())
                    if (hosts.isEmpty()) null else LanguageSection(code, title, hosts)
                }
                val sortedAll = sortHosts(allHosts)
                _state.value = DiscoverState.Success(
                    sections = sections,
                    allHosts = sortedAll,
                    filteredHosts = sortedAll
                )
            } else {
                val fallback = getDiscoverHostsUseCase()
                if (fallback.isSuccess) {
                    val hosts = sortHosts(fallback.getOrDefault(emptyList()))
                    _state.value = DiscoverState.Success(
                        sections = listOf(LanguageSection("all", "All Hosts", hosts)),
                        allHosts = hosts,
                        filteredHosts = hosts
                    )
                } else {
                    _state.value = DiscoverState.Error(
                        fallback.exceptionOrNull()?.message ?: "Failed to load hosts"
                    )
                }
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
            val sorted = sortHosts(filtered)
            val sortedIds = sorted.map { it.uid }.toSet()
            val filteredSections = currentState.sections.map { section ->
                section.copy(hosts = sortHosts(section.hosts.filter { it.uid in sortedIds }))
            }.filter { it.hosts.isNotEmpty() }

            _state.value = currentState.copy(
                filteredHosts = sorted,
                sections = if (newFilters == DiscoverFilters()) currentState.sections else filteredSections,
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
        updateFilters(currentFilters.copy(ageGroup = if (currentFilters.ageGroup == ageGroup) null else ageGroup))
    }

    fun toggleVibeFilter(vibe: String) {
        val currentFilters = (state.value as? DiscoverState.Success)?.filters ?: DiscoverFilters()
        updateFilters(currentFilters.copy(vibeTag = if (currentFilters.vibeTag == vibe) null else vibe))
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
