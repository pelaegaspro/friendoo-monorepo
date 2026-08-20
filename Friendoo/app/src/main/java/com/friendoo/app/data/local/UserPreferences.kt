package com.friendoo.app.data.local

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserPreferences @Inject constructor(
    private val dataStore: DataStore<Preferences>
) {
    companion object {
        val AUTH_TOKEN = stringPreferencesKey("auth_token")
        val USER_ID = stringPreferencesKey("user_id")
        val ONBOARDING_COMPLETED = booleanPreferencesKey("onboarding_completed")
        val CONSENT_GIVEN = booleanPreferencesKey("consent_given")
        val FCM_TOKEN = stringPreferencesKey("fcm_token")
        val IS_HOST = booleanPreferencesKey("is_host")
    }

    val authTokenFlow: Flow<String?> = dataStore.data.map { preferences ->
        preferences[AUTH_TOKEN]
    }

    val userIdFlow: Flow<String?> = dataStore.data.map { preferences ->
        preferences[USER_ID]
    }

    val onboardingCompletedFlow: Flow<Boolean> = dataStore.data.map { preferences ->
        preferences[ONBOARDING_COMPLETED] ?: false
    }

    val consentGivenFlow: Flow<Boolean> = dataStore.data.map { preferences ->
        preferences[CONSENT_GIVEN] ?: false
    }

    val fcmTokenFlow: Flow<String?> = dataStore.data.map { preferences ->
        preferences[FCM_TOKEN]
    }

    val isHostFlow: Flow<Boolean> = dataStore.data.map { preferences ->
        preferences[IS_HOST] ?: false
    }

    suspend fun saveAuthToken(token: String) {
        dataStore.edit { preferences ->
            preferences[AUTH_TOKEN] = token
        }
    }

    suspend fun saveUserId(userId: String) {
        dataStore.edit { preferences ->
            preferences[USER_ID] = userId
        }
    }

    suspend fun setOnboardingCompleted(completed: Boolean) {
        dataStore.edit { preferences ->
            preferences[ONBOARDING_COMPLETED] = completed
        }
    }

    suspend fun saveConsentGiven(given: Boolean) {
        dataStore.edit { preferences ->
            preferences[CONSENT_GIVEN] = given
        }
    }

    suspend fun saveFcmToken(token: String) {
        dataStore.edit { preferences ->
            preferences[FCM_TOKEN] = token
        }
    }

    suspend fun setIsHost(isHost: Boolean) {
        dataStore.edit { preferences ->
            preferences[IS_HOST] = isHost
        }
    }

    suspend fun clearAll() {
        dataStore.edit { preferences ->
            preferences.clear()
        }
    }
}
