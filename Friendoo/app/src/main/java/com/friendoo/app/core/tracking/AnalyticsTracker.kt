package com.friendoo.app.core.tracking

import android.util.Log
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AnalyticsTracker @Inject constructor() {
    fun logEvent(eventType: String, metadata: Map<String, Any?> = emptyMap()) {
        Log.d("Analytics", "$eventType: $metadata")
    }

    fun logPageView(screenName: String) {
        Log.d("Analytics", "PageView: $screenName")
    }

    fun logButtonClick(buttonName: String, screenName: String) {
        Log.d("Analytics", "ButtonClick: $buttonName on $screenName")
    }
}
