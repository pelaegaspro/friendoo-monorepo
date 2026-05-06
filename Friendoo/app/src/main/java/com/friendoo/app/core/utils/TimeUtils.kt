package com.friendoo.app.core.utils

import com.google.firebase.Timestamp
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

object TimeUtils {
    fun formatTimestamp(timestamp: Timestamp?): String {
        if (timestamp == null) return ""
        val now = Date()
        val date = timestamp.toDate()
        val diffInMillies = Math.abs(now.time - date.time)
        val diffInMinutes = TimeUnit.MINUTES.convert(diffInMillies, TimeUnit.MILLISECONDS)
        val diffInHours = TimeUnit.HOURS.convert(diffInMillies, TimeUnit.MILLISECONDS)
        val diffInDays = TimeUnit.DAYS.convert(diffInMillies, TimeUnit.MILLISECONDS)

        return when {
            diffInMinutes < 1 -> "Just now"
            diffInMinutes < 60 -> "$diffInMinutes min ago"
            diffInHours < 24 -> "$diffInHours hr ago"
            diffInDays == 1L -> "Yesterday"
            diffInDays < 7 -> "$diffInDays days ago"
    fun getNextPayoutDate(): String {
        val calendar = java.util.Calendar.getInstance()
        val today = calendar.get(java.util.Calendar.DAY_OF_WEEK)
        
        // Payout cycle: Every Monday
        val daysUntilMonday = if (today == java.util.Calendar.MONDAY) {
            7 // Next Monday if today is already Monday
        } else if (today < java.util.Calendar.MONDAY) {
            java.util.Calendar.MONDAY - today
        } else {
            7 - (today - java.util.Calendar.MONDAY)
        }
        
        calendar.add(java.util.Calendar.DAY_OF_YEAR, daysUntilMonday)
        return SimpleDateFormat("EEEE, dd MMM", Locale.getDefault()).format(calendar.time)
    }
}
