package com.friendoo.app.data.remote.firebase

import android.graphics.Bitmap
import com.google.firebase.storage.FirebaseStorage
import kotlinx.coroutines.tasks.await
import java.io.ByteArrayOutputStream
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class StorageSource @Inject constructor() {
    private val storage = FirebaseStorage.getInstance()

    suspend fun uploadAvatar(userId: String, bitmap: Bitmap): String {
        val storageRef = storage.reference.child("avatars/$userId/avatar.png")
        
        val baos = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, baos)
        val data = baos.toByteArray()

        storageRef.putBytes(data).await()
        return "avatars/$userId/avatar.png"
    }

    suspend fun getDownloadUrl(path: String): String {
        return storage.reference.child(path).downloadUrl.await().toString()
    }
}
