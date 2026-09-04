package com.friendoo.friendoo

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.wifi.WifiManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat

class CallForegroundService : Service() {

    companion object {
        const val CHANNEL_ID = "friendoo_active_call_channel"
        const val CHANNEL_NAME = "Friendoo Active Voice Calls"
        const val NOTIFICATION_ID = 8801

        const val ACTION_START = "com.friendoo.friendoo.ACTION_START_CALL"
        const val ACTION_UPDATE_TIMER = "com.friendoo.friendoo.ACTION_UPDATE_TIMER"
        const val ACTION_STOP = "com.friendoo.friendoo.ACTION_STOP_CALL"

        const val EXTRA_CALL_ID = "extra_call_id"
        const val EXTRA_PARTNER_NAME = "extra_partner_name"
        const val EXTRA_DURATION_TEXT = "extra_duration_text"

        var isRunning = false
            private set
    }

    private var wakeLock: PowerManager.WakeLock? = null
    private var wifiLock: WifiManager.WifiLock? = null
    private var currentPartnerName: String = "Host"

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        acquireLocks()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                isRunning = true
                currentPartnerName = intent.getStringExtra(EXTRA_PARTNER_NAME) ?: "Partner"
                val duration = intent.getStringExtra(EXTRA_DURATION_TEXT) ?: "00:00"
                startForegroundNotification(currentPartnerName, duration)
            }
            ACTION_UPDATE_TIMER -> {
                val duration = intent.getStringExtra(EXTRA_DURATION_TEXT) ?: "00:00"
                updateNotification(currentPartnerName, duration)
            }
            ACTION_STOP -> {
                stopForegroundService()
            }
        }
        return START_NOT_STICKY
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Ongoing 1-on-1 Friendoo audio lounge session"
                setShowBadge(true)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(partner: String, duration: String): Notification {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_sys_phone_call)
            .setContentTitle("Friendoo Audio Lounge · $duration")
            .setContentText("Connected with $partner")
            .setSubText("Live Voice Call")
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setColor(0xFF8A3FFC.toInt())
            .build()
    }

    private fun startForegroundNotification(partner: String, duration: String) {
        val notification = buildNotification(partner, duration)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            var serviceType = ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                serviceType = serviceType or ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
            }
            startForeground(NOTIFICATION_ID, notification, serviceType)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun updateNotification(partner: String, duration: String) {
        if (!isRunning) return
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, buildNotification(partner, duration))
    }

    private fun acquireLocks() {
        try {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Friendoo:CallWakeLock").apply {
                setReferenceCounted(false)
                acquire(4 * 60 * 60 * 1000L) // Safety cap of 4 hours
            }

            val wifiManager = applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            val wifiMode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                WifiManager.WIFI_MODE_FULL_LOW_LATENCY
            } else {
                WifiManager.WIFI_MODE_FULL_HIGH_PERF
            }
            wifiLock = wifiManager.createWifiLock(wifiMode, "Friendoo:WifiLock").apply {
                setReferenceCounted(false)
                acquire()
            }
        } catch (e: Exception) {
            // Non-fatal if device policy restricts wakelock
        }
    }

    private fun releaseLocks() {
        try {
            if (wakeLock?.isHeld == true) {
                wakeLock?.release()
            }
            wakeLock = null

            if (wifiLock?.isHeld == true) {
                wifiLock?.release()
            }
            wifiLock = null
        } catch (e: Exception) {
            // Ignore lock release errors
        }
    }

    private fun stopForegroundService() {
        isRunning = false
        releaseLocks()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
        stopSelf()
    }

    override fun onDestroy() {
        stopForegroundService()
        super.onDestroy()
    }
}
