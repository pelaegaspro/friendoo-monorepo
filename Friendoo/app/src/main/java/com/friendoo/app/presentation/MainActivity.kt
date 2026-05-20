package com.friendoo.app.presentation

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.navigation.compose.rememberNavController
import com.cashfree.pg.api.CFPaymentGatewayService
import com.cashfree.pg.core.api.callback.CFCheckoutResponseCallback
import com.cashfree.pg.core.api.utils.CFErrorResponse
import com.friendoo.app.data.local.UserPreferences
import com.friendoo.app.presentation.theme.FriendooTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity(), CFCheckoutResponseCallback {

    @Inject
    lateinit var userPreferences: UserPreferences

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { _: Boolean ->
        // Handle permission result
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        askNotificationPermission()
        setContent {
            FriendooTheme {
                val navController = rememberNavController()
                AppNavigation(navController, userPreferences)
            }
        }
    }

    override fun onResume() {
        super.onResume()
        // Re-register Cashfree callback on every resume so the SDK can deliver
        // payment results even if the Activity was recreated during checkout.
        try {
            CFPaymentGatewayService.getInstance().setCheckoutCallback(this)
        } catch (e: Exception) {
            Log.w("Cashfree", "Could not register checkout callback: ${e.message}")
        }
    }

    // ── CFCheckoutResponseCallback ───────────────────────────────────────────

    /**
     * Called by the Cashfree SDK when payment verification completes.
     * WalletViewModel registers its own per-payment callback; this Activity-level
     * handler acts as a safety fallback for orphaned callbacks.
     */
    override fun onPaymentVerify(orderId: String) {
        Log.d("Cashfree", "MainActivity.onPaymentVerify: orderId=$orderId")
    }

    override fun onPaymentFailure(error: CFErrorResponse?, orderId: String?) {
        Log.w("Cashfree", "MainActivity.onPaymentFailure: orderId=$orderId, error=${error?.message}")
    }

    private fun askNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) !=
                PackageManager.PERMISSION_GRANTED
            ) {
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }
}
