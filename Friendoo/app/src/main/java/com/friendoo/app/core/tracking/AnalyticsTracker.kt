package com.friendoo.app.core.tracking

import com.friendoo.app.data.local.UserPreferences
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Stub Analytics Tracker - Firebase dependencies removed
 */
@Singleton
class AnalyticsTracker @Inject constructor(
    private val userPreferences: UserPreferences
) {
    fun logEvent(eventType: String, metadata: Map<String, Any?> = emptyMap()) {
        // Stub - no-op
    }

    fun logPageView(screenName: String) {
        // Stub - no-op
    }

    fun logButtonClick(buttonName: String, screenName: String) {
        // Stub - no-op
    }
}
