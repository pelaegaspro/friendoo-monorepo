package com.friendoo.app.presentation.report

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.friendoo.app.data.local.UserPreferences
import com.friendoo.app.data.repository.AuthRepository
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FieldValue
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

data class ReportUiState(
    val isSubmitting: Boolean = false,
    val isSuccess: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class ReportViewModel @Inject constructor(
    private val userPreferences: UserPreferences,
    private val firestore: FirebaseFirestore,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _state = MutableStateFlow(ReportUiState())
    val state: StateFlow<ReportUiState> = _state

    fun submitReport(
        reportedUserId: String,
        reportedAlias: String,
        reason: String,
        description: String? = null,
        amountLost: Double? = null,
        evidenceUri: Uri? = null,
        messageSnippet: String? = null,
        sessionId: String? = null
    ) {
        viewModelScope.launch {
            _state.value = ReportUiState(isSubmitting = true)

            try {
                val reporterId = authRepository.getCurrentUserId()
                    ?: throw IllegalStateException("User not authenticated")

                val reportData = hashMapOf(
                    "reporterId" to reporterId,
                    "reportedId" to reportedUserId,
                    "reportedAlias" to reportedAlias,
                    "reason" to reason,
                    "description" to description,
                    "amountLost" to amountLost,
                    "messageSnippet" to messageSnippet,
                    "sessionId" to sessionId,
                    "status" to "pending",
                    "createdAt" to FieldValue.serverTimestamp()
                )

                firestore.collection("reports").add(reportData).await()
                _state.value = ReportUiState(isSuccess = true)
            } catch (e: Exception) {
                _state.value = ReportUiState(error = e.message ?: "Submission failed")
            }
        }
    }

    fun resetState() {
        _state.value = ReportUiState()
    }
}
