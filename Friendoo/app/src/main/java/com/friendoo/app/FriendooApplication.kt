package com.friendoo.app

import android.app.Application
import android.util.Log
import com.cashfree.pg.api.CFPaymentGatewayService
import com.cashfree.pg.core.api.exception.CFException
import com.friendoo.app.di.AppEntryPoint
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.appcheck.FirebaseAppCheck
import com.google.firebase.appcheck.playintegrity.PlayIntegrityAppCheckProviderFactory
import com.google.firebase.FirebaseApp
import dagger.hilt.android.HiltAndroidApp
import dagger.hilt.android.EntryPointAccessors
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch

@HiltAndroidApp
class FriendooApplication : Application() {

    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()
        
        // Configure Firestore settings early to prevent IllegalStateException later
        try {
            val firestore = com.google.firebase.firestore.FirebaseFirestore.getInstance()
            val cacheSettings = com.google.firebase.firestore.PersistentCacheSettings.newBuilder()
                .setSizeBytes(com.google.firebase.firestore.FirebaseFirestoreSettings.CACHE_SIZE_UNLIMITED)
                .build()
            val settings = com.google.firebase.firestore.FirebaseFirestoreSettings.Builder()
                .setLocalCacheSettings(cacheSettings)
                .build()
            firestore.firestoreSettings = settings
            Log.d("FriendooApplication", "FirebaseFirestore settings initialized early successfully.")
        } catch (e: IllegalStateException) {
            Log.w("FriendooApplication", "FirebaseFirestore settings already locked/initialized: ${e.message}")
        } catch (e: Exception) {
            Log.e("FriendooApplication", "Failed early FirebaseFirestore initialization: ${e.message}", e)
        }
        
        // Initialize Firebase App Check defensively
        try {
            val firebaseAppCheck = FirebaseAppCheck.getInstance()
            firebaseAppCheck.installAppCheckProviderFactory(
                PlayIntegrityAppCheckProviderFactory.getInstance()
            )
            Log.d("FriendooApplication", "Firebase App Check initialized successfully.")
        } catch (e: Exception) {
            Log.e("FriendooApplication", "Firebase App Check initialization skipped/failed: ${e.message}", e)
        }

        try {
            CFPaymentGatewayService.initialize(this)
        } catch (e: CFException) {
            Log.e("Cashfree", "SDK initialization failed: ${e.message}")
        } catch (e: Exception) {
            Log.e("Cashfree", "Unexpected initialization error: ${e.message}")
        }

        try {
            val entryPoint = EntryPointAccessors.fromApplication(this, AppEntryPoint::class.java)
            entryPoint.appLifecycleObserver().register()
            reconcileAuthSession(entryPoint)
        } catch (e: Exception) {
            Log.e("FriendooApplication", "Hilt entry point resolution failed during startup: ${e.message}", e)
        }
    }

    private fun reconcileAuthSession(entryPoint: AppEntryPoint) {
        appScope.launch {
            try {
                val firebaseUser = FirebaseAuth.getInstance().currentUser
                val prefs = entryPoint.userPreferences()
                val storedUserId = prefs.userIdFlow.firstOrNull()
                when {
                    firebaseUser == null && !storedUserId.isNullOrBlank() -> {
                        entryPoint.authRepository().signOut()
                    }
                    firebaseUser != null && storedUserId.isNullOrBlank() -> {
                        prefs.saveUserId(firebaseUser.uid)
                        entryPoint.authRepository().refreshIdToken()
                    }
                }
            } catch (e: Exception) {
                Log.e("FriendooApplication", "Failed to reconcile auth session: ${e.message}", e)
            }
        }
    }
}
