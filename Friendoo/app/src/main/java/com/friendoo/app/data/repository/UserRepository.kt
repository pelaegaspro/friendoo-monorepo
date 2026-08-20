package com.friendoo.app.data.repository

import com.friendoo.app.data.model.User
import com.friendoo.app.data.remote.firebase.FirestoreSource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserRepository @Inject constructor(
    private val firestoreSource: FirestoreSource
) {
    suspend fun getUser(uid: String): Result<User> {
        return firestoreSource.getDocument("users", uid).map { User.fromMap(it) }
    }

    suspend fun saveUser(user: User): Result<Unit> {
        return firestoreSource.setDocument("users", user.uid, user.toMap())
    }

    fun getUserFlow(uid: String): Flow<User> {
        return firestoreSource.addSnapshotListener("users", uid).map { User.fromMap(it) }
    }
}
