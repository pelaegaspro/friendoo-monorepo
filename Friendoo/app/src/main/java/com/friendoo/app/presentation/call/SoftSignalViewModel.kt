package com.friendoo.app.presentation.call

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Stub SoftSignal ViewModel - Firebase dependencies removed
 */
@HiltViewModel
class SoftSignalViewModel @Inject constructor() : ViewModel() {

    fun submitSoftSignal(
        hostId: String,
        sessionId: String,
        freeText: String
    ) {
        viewModelScope.launch {
            // Stub implementation - silent fail as per original behavior
        }
    }
}
