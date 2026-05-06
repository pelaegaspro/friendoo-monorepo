package com.friendoo.app.data.repository

import com.friendoo.app.data.model.Host
import com.friendoo.app.data.remote.firebase.FirestoreSource
import com.google.firebase.firestore.FirebaseFirestore
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class HostRepository @Inject constructor(
    private val firestoreSource: FirestoreSource,
    private val firestore: FirebaseFirestore
) {
    suspend fun getHosts(): Result<List<Host>> {
        val query = firestore.collection("users").whereEqualTo("isHost", true)
        return firestoreSource.getCollection("users", query).map { list ->
            list.map { Host.fromMap(it) }
        }
    }
}
