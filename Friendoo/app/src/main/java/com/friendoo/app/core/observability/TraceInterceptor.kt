package com.friendoo.app.core.observability

import com.google.firebase.perf.FirebasePerformance
import com.google.firebase.perf.metrics.HttpMetric
import okhttp3.Interceptor
import okhttp3.Request
import okhttp3.Response
import java.io.IOException

/**
 * An OkHttp Interceptor that manually adds Firebase Performance traces to all outgoing network requests.
 * This is particularly useful for tracking latencies of third-party APIs (like Agora or Cashfree).
 */
class TraceInterceptor : Interceptor {
    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val request: Request = chain.request()
        
        // Start a Firebase Performance HttpMetric
        val metric: HttpMetric = FirebasePerformance.getInstance().newHttpMetric(
            request.url.toString(),
            request.method
        )
        metric.start()

        val response: Response
        try {
            response = chain.proceed(request)
            metric.setHttpResponseCode(response.code)
            metric.setResponsePayloadSize(response.body?.contentLength() ?: 0L)
        } catch (e: IOException) {
            metric.putAttribute("error", e.message ?: "unknown")
            metric.stop()
            throw e
        }

        metric.stop()
        return response
    }
}
