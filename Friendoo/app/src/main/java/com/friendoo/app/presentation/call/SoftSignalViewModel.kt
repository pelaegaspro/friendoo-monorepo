package com.friendoo.app.presentation.call

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.friendoo.app.data.repository.AuthRepository
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FieldValue
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

@HiltViewModel
class SoftSignalViewModel @Inject constructor(
    private val firestore: FirebaseFirestore,
    private val authRepository: AuthRepository
) : ViewModel() {

    fun submitSoftSignal(
        hostId: String,
        sessionId: String,
        freeText: String
    ) {
        viewModelScope.launch {
            try {
                val userId = authRepository.getCurrentUserId() ?: return@launch
                val signalData = hashMapOf(
                    "userId" to userId,
                    "hostId" to hostId,
                    "sessionId" to sessionId,
                    "freeText" to freeText,
                    "createdAt" to FieldValue.serverTimestamp()
                )
                firestore.collection("softSignals").add(signalData).await()
            } catch (e: Exception) {
                // Silent fail - non-critical feature
            }
        }
    }
}
