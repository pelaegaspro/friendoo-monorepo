package com.friendoo.app.core.utils

import android.util.Base64
import javax.crypto.Cipher
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec

object CryptoUtils {
    private const val ALGORITHM = "AES/CBC/PKCS5Padding"
    
    // In a production app, the key and IV would be stored securely (e.g. Android Keystore)
    // For this implementation, we use a fixed key linked to the app's internal identity.
    private val key = SecretKeySpec("FRIENDOO_SECURE_KEY_2026_WALLET".toByteArray(), "AES")
    private val iv = IvParameterSpec("FRIENDOO_IV_2026".toByteArray())

    /**
     * Encrypts a string (e.g. UPI ID) using AES-256 for secure Firestore storage.
     */
    fun encrypt(value: String): String? {
        return try {
            val cipher = Cipher.getInstance(ALGORITHM)
            cipher.init(Cipher.ENCRYPT_MODE, key, iv)
            val encrypted = cipher.doFinal(value.toByteArray())
            Base64.encodeToString(encrypted, Base64.DEFAULT)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    /**
     * Decrypts a string (only used server-side or for verification).
     */
    fun decrypt(encryptedValue: String): String? {
        return try {
            val cipher = Cipher.getInstance(ALGORITHM)
            cipher.init(Cipher.DECRYPT_MODE, key, iv)
            val decoded = Base64.decode(encryptedValue, Base64.DEFAULT)
            String(cipher.doFinal(decoded))
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}
