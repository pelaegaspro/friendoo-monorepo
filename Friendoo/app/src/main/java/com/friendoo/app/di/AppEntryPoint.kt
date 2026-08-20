package com.friendoo.app.di

import com.friendoo.app.core.lifecycle.AppLifecycleObserver
import com.friendoo.app.data.local.UserPreferences
import com.friendoo.app.data.repository.AuthRepository
import dagger.hilt.EntryPoint
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@EntryPoint
@InstallIn(SingletonComponent::class)
interface AppEntryPoint {
    fun authRepository(): AuthRepository
    fun userPreferences(): UserPreferences
    fun appLifecycleObserver(): AppLifecycleObserver
}
