package com.friendoo.app.data.repository

import com.friendoo.app.BuildConfig
import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.GoogleGenerativeAIException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class HybridSafetyMonitor @Inject constructor() {

    // ── Groq: Fast pre-filter (500ms timeout)
    private val groqClient = OkHttpClient.Builder()
        .connectTimeout(2, TimeUnit.SECONDS)
        .readTimeout(3, TimeUnit.SECONDS)
        .build()

    private val groqApiKey = BuildConfig.GROQ_API_KEY

    // ── Gemini: Deep analysis (Indian context expert)
    private val geminiModel = GenerativeModel(
        modelName = "gemini-1.5-flash",
        apiKey = BuildConfig.GEMINI_API_KEY
    )

    /**
     * Two-layer analysis:
     * 1. Groq fast check — catches obvious violations instantly
     * 2. Gemini deep check — only if Groq finds something or is uncertain
     */
    suspend fun analyzeContent(
        text: String,
        context: String = "voice_call"
    ): SafetyResult = withContext(Dispatchers.IO) {

        // Skip very short text
        if (text.length < 15) return@withContext SafetyResult.CLEAN

        // ── LAYER 1: Groq Fast Filter ──
        val groqResult = try {
            withTimeout(2000) {  // 2 second max for Groq
                fastGroqCheck(text)
            }
        } catch (e: TimeoutCancellationException) {
            FastCheckResult(uncertain = true, violation = null)
        } catch (e: Exception) {
            FastCheckResult(uncertain = true, violation = null)
        }

        // Groq is confident and clean → return immediately
        if (!groqResult.uncertain && groqResult.violation == null) {
            return@withContext SafetyResult.CLEAN
        }

        // Groq found something OR is uncertain → go to Gemini
        // ── LAYER 2: Gemini Deep Analysis ──
        return@withContext geminiDeepCheck(text, context)
    }

    // ─────────────────────────────────────────────
    // GROQ FAST FILTER
    // ─────────────────────────────────────────────

    private suspend fun fastGroqCheck(text: String): FastCheckResult {
        val prompt = """
        You are a fast content filter. Analyze this text from an Indian voice call app.
        Text: "$text"

        Check ONLY for these obvious violations:
        1. Payment keywords: "GPay", "PhonePe", "UPI", "bank transfer", "send money", "pay me directly"
        2. Contact sharing: "WhatsApp", "Instagram", "phone number", "my number is", "call me on"
        3. Explicit sexual words or requests
        4. Threats or abuse: "I will", "kill", "hurt you", "come to your house"

        Respond with EXACTLY one word:
        CLEAN        (no obvious violation)
        PAYMENT      (off-platform payment request)
        CONTACT      (asking to share personal contact)
        EXPLICIT     (sexual/inappropriate content)
        THREAT       (threatening or abusive)
        UNCLEAR      (needs deeper analysis)

        Be fast. One word only.
        """.trimIndent()

        val requestBody = JSONObject().apply {
            put("model", "llama-3.1-8b-instant")
            put("messages", JSONObject().apply {
                put("role", "user")
                put("content", prompt)
            })
            put("temperature", 0.0)
            put("max_tokens", 10)
        }.toString()

        val request = Request.Builder()
            .url("https://api.groq.com/openai/v1/chat/completions")
            .header("Authorization", "Bearer $groqApiKey")
            .header("Content-Type", "application/json")
            .post(requestBody.toRequestBody("application/json".toMediaType()))
            .build()

        val response = groqClient.newCall(request).execute()
        val responseBody = response.body?.string() ?: return FastCheckResult(uncertain = true, null)

        val json = JSONObject(responseBody)
        val content = json.getJSONArray("choices")
            .getJSONObject(0)
            .getJSONObject("message")
            .getString("content")
            .trim()
            .uppercase()

        return when {
            content.contains("CLEAN")    -> FastCheckResult(uncertain = false, null)
            content.contains("PAYMENT")  -> FastCheckResult(uncertain = false, "OFF_PLATFORM_PAYMENT")
            content.contains("CONTACT")  -> FastCheckResult(uncertain = false, "PERSONAL_INFO_REQUEST")
            content.contains("EXPLICIT") -> FastCheckResult(uncertain = false, "INAPPROPRIATE_CONTENT")
            content.contains("THREAT")   -> FastCheckResult(uncertain = false, "HARASSMENT")
            else                         -> FastCheckResult(uncertain = true, null)
        }
    }

    data class FastCheckResult(
        val uncertain: Boolean,
        val violation: String?  // null = clean
    )

    // ─────────────────────────────────────────────
    // GEMINI DEEP ANALYSIS
    // ─────────────────────────────────────────────

    private suspend fun geminiDeepCheck(text: String, context: String): SafetyResult {
        return try {
            val prompt = """
            You are a content safety moderator for Friendoo, an Indian voice call platform.
            Analyze this $context text carefully.

            Text: "$text"

            Consider Indian context:
            - Hinglish (Hindi + English mix)
            - Implied requests (not direct words)
            - Cultural nuances

            Respond ONLY with one of these exact formats:
            CLEAN
            OFF_PLATFORM_PAYMENT|severity|matched_text
            INAPPROPRIATE_CONTENT|severity|matched_text
            HARASSMENT|severity|matched_text
            PERSONAL_INFO_REQUEST|severity|matched_text

            Severity: LOW, MEDIUM, HIGH, CRITICAL
            """.trimIndent()

            val response = geminiModel.generateContent(prompt)
            val resultText = response.text ?: return SafetyResult.CLEAN

            parseGeminiResult(resultText.trim())

        } catch (e: GoogleGenerativeAIException) {
            SafetyResult.ERROR(errorMessage = e.message)
        } catch (e: Exception) {
            SafetyResult.ERROR(errorMessage = e.message)
        }
    }

    private fun parseGeminiResult(raw: String): SafetyResult {
        return when {
            raw.startsWith("CLEAN") -> SafetyResult.CLEAN
            raw.contains("|") -> {
                val parts = raw.split("|")
                SafetyResult.Violation(
                    violationType = parts.getOrNull(0) ?: "UNKNOWN",
                    severity = parts.getOrNull(1) ?: "LOW",
                    matchedText = parts.getOrNull(2) ?: ""
                )
            }
            else -> SafetyResult.CLEAN
        }
    }
}

// ── Result sealed class (shared) ──
sealed class SafetyResult {
    object CLEAN : SafetyResult()
    data class Violation(
        val violationType: String,
        val severity: String,
        val matchedText: String
    ) : SafetyResult()
    data class ERROR(
        val errorMessage: String? = null
    ) : SafetyResult()
}
