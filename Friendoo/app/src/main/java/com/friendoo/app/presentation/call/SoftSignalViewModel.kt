package com.friendoo.app.presentation.call

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.security.MessageDigest
import javax.inject.Inject

@HiltViewModel
class SoftSignalViewModel @Inject constructor(
    private val firestore: FirebaseFirestore,
    private val auth: FirebaseAuth
) : ViewModel() {

    fun submitSoftSignal(
        hostId: String,
        sessionId: String,
        freeText: String
    ) {
        viewModelScope.launch {
            try {
                val hashedUserId = auth.currentUser?.uid
                    ?.let { hashUserId(it) } ?: return@launch

                val signal = hashMapOf(
                    "userId" to hashedUserId,
                    "hostId" to hostId,
                    "callSessionId" to sessionId,
                    "freeText" to freeText.trim(),
                    "createdAt" to FieldValue.serverTimestamp(),
                    "reviewed" to false
                )

                firestore.collection("softSignals").add(signal)
                    .await()

            } catch (e: Exception) {
                // Silent fail — never show error to user for soft signal
                // This must never interrupt their experience
            }
        }
    }

    // One-way hash — anonymous but consistent for dedup
    private fun hashUserId(uid: String): String {
        val bytes = MessageDigest
            .getInstance("SHA-256")
            .digest(uid.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
            .take(16)  // short enough to be non-identifying
    }
}
