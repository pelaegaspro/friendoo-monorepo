package com.friendoo.app.presentation.report

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.friendoo.app.data.model.Report
import com.friendoo.app.data.model.ReportMessage
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.*
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
        viewModelScope.launch {
            try {
                val reportSnap = firestore.collection("reports").document(reportId).get().await()
                if (reportSnap.exists()) {
                    val data = reportSnap.data ?: return@launch
                    _report.value = Report(
                        id = reportSnap.id,
                        reportedId = data["reportedId"] as? String ?: "",
                        reportedAlias = data["reportedAlias"] as? String ?: "",
                        reporterId = data["reporterId"] as? String ?: "",
                        reason = data["reason"] as? String ?: "",
                        status = data["status"] as? String ?: "pending"
                    )
                }

                val messagesSnap = firestore.collection("reports").document(reportId)
                    .collection("messages")
                    .orderBy("createdAt", Query.Direction.ASCENDING)
                    .get()
                    .await()

                _messages.value = messagesSnap.documents.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    val timestamp = data["createdAt"] as? com.google.firebase.Timestamp
                    val dateStr = timestamp?.toDate()?.let {
                        SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault()).format(it)
                    } ?: ""
                    ReportMessage(
                        id = doc.id,
                        text = data["text"] as? String ?: "",
                        senderType = data["senderType"] as? String ?: "user",
                        createdAt = dateStr
                    )
                }
            } catch (e: Exception) {
                // Error loading thread
            }
        }
    }

    fun markMessagesAsRead(reportId: String) {
        viewModelScope.launch {
            try {
                val updates = mapOf("readAt" to com.google.firebase.Timestamp.now())
                val snap = firestore.collection("reports").document(reportId)
                    .collection("messages")
                    .whereEqualTo("senderType", "admin")
                    .whereEqualTo("readAt", null)
                    .get()
                    .await()
                for (doc in snap.documents) {
                    doc.reference.update(updates).await()
                }
            } catch (e: Exception) {
                // Silent fail
            }
        }
    }
}
