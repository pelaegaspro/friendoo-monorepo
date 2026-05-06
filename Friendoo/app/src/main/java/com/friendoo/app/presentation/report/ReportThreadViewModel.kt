package com.friendoo.app.presentation.report

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.friendoo.app.data.model.Report
import com.friendoo.app.data.model.ReportMessage
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

@HiltViewModel
class ReportThreadViewModel @Inject constructor(
    private val firestore: FirebaseFirestore
) : ViewModel() {

    private val _messages = MutableStateFlow<List<ReportMessage>>(emptyList())
    val messages: StateFlow<List<ReportMessage>> = _messages

    private val _report = MutableStateFlow<Report?>(null)
    val report: StateFlow<Report?> = _report

    fun loadThread(reportId: String) {
        // Listen to report status changes in real time
        firestore.collection("reports").document(reportId)
            .addSnapshotListener { snap, _ ->
                _report.value = snap?.toObject(Report::class.java)?.copy(id = snap.id)
            }

        // Listen to messages in real time
        firestore.collection("reports").document(reportId).collection("messages")
            .orderBy("createdAt", Query.Direction.ASCENDING)
            .addSnapshotListener { snap, _ ->
                _messages.value = snap?.documents
                    ?.mapNotNull { it.toObject(ReportMessage::class.java)?.copy(id = it.id) }
                    ?: emptyList()

                // Mark admin messages as delivered
                snap?.documents?.forEach { doc ->
                    val msg = doc.toObject(ReportMessage::class.java)
                    if (msg?.senderType == "admin" && msg.deliveredAt == null) {
                        doc.reference.update("deliveredAt", FieldValue.serverTimestamp())
                    }
                }
            }
    }

    fun markMessagesAsRead(reportId: String) {
        // Mark all admin messages as read when user opens thread
        viewModelScope.launch {
            try {
                val msgs = firestore
                    .collection("reports").document(reportId).collection("messages")
                    .whereEqualTo("senderType", "admin")
                    .whereEqualTo("readAt", null)
                    .get().await()

                msgs.documents.forEach { doc ->
                    doc.reference.update("readAt", FieldValue.serverTimestamp())
                }
            } catch (e: Exception) {
                // Silent failure for UI metadata updates
            }
        }
    }
}
