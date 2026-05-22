package com.friendoo.app.core.lifecycle

import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ProcessLifecycleOwner
import com.friendoo.app.core.presence.PresenceManager
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AppLifecycleObserver @Inject constructor(
    private val presenceManager: PresenceManager
) : DefaultLifecycleObserver {

    fun register() {
        ProcessLifecycleOwner.get().lifecycle.addObserver(this)
    }

    override fun onStart(owner: LifecycleOwner) {
        presenceManager.onAppForeground()
    }

    override fun onStop(owner: LifecycleOwner) {
        presenceManager.onAppBackground()
    }
}
