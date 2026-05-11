package com.friendoo.app.presentation.report

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.friendoo.app.data.model.Report
import com.friendoo.app.data.model.ReportMessage
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ReportThreadViewModel @Inject constructor() : ViewModel() {

    private val _messages = MutableStateFlow<List<ReportMessage>>(emptyList())
    val messages: StateFlow<List<ReportMessage>> = _messages

    private val _report = MutableStateFlow<Report?>(null)
    val report: StateFlow<Report?> = _report

    fun loadThread(reportId: String) {
        // Stub implementation - load mock data
        viewModelScope.launch {
            _report.value = Report(
                id = reportId,
                reportedId = "",
                reportedAlias = "",
                reporterId = "",
                reason = "",
                status = "pending"
            )
            _messages.value = emptyList()
        }
    }

    fun markMessagesAsRead(reportId: String) {
        // Stub implementation - no-op
    }
}
