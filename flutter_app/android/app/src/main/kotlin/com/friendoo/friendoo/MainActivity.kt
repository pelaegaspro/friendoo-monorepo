package com.friendoo.friendoo

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.net.Uri
import android.os.Build
import android.content.pm.PackageManager
import android.util.Base64
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.ByteArrayOutputStream

class MainActivity : FlutterActivity() {

    private companion object {
        const val UPI_CHANNEL = "com.friendoo.friendoo/upi"
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, UPI_CHANNEL)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "getInstalledUpiApps" -> {
                        result.success(getInstalledUpiApps())
                    }
                    "launchDirectUpiApp" -> {
                        val packageName = call.argument<String>("packageName")
                        val uri = call.argument<String>("uri")
                        if (packageName.isNullOrBlank() || uri.isNullOrBlank()) {
                            result.error("INVALID_ARGS", "packageName and uri are required", null)
                        } else {
                            result.success(launchDirectUpiApp(packageName, uri))
                        }
                    }
                    else -> result.notImplemented()
                }
            }
    }

    private fun getInstalledUpiApps(): List<Map<String, String>> {
        val resultList = mutableListOf<Map<String, String>>()
        val foundPackages = mutableSetOf<String>()

        val upiIntent = Intent(Intent.ACTION_VIEW).apply {
            data = Uri.parse("upi://pay")
        }

        val resolveInfoList = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            packageManager.queryIntentActivities(
                upiIntent,
                PackageManager.ResolveInfoFlags.of(PackageManager.MATCH_DEFAULT_ONLY.toLong())
            )
        } else {
            @Suppress("DEPRECATION")
            packageManager.queryIntentActivities(upiIntent, PackageManager.MATCH_DEFAULT_ONLY)
        }

        for (info in resolveInfoList) {
            try {
                val appInfo = info.activityInfo.applicationInfo ?: continue
                val pkg = info.activityInfo.packageName
                if (foundPackages.contains(pkg)) continue
                foundPackages.add(pkg)
                val name = packageManager.getApplicationLabel(appInfo).toString()
                val icon = packageManager.getApplicationIcon(appInfo)
                val iconBase64 = drawableToBase64(icon)

                resultList.add(
                    mapOf(
                        "name" to name,
                        "packageName" to pkg,
                        "iconBase64" to iconBase64
                    )
                )
            } catch (_: Exception) {}
        }

        // Secondary check for prominent Indian UPI apps to ensure no app is missed on Android 14/15/16
        val commonUpiPackages = listOf(
            "com.google.android.apps.nbu.paisa.user",
            "com.phonepe.app",
            "net.one97.paytm",
            "in.amazon.mShop.android.shopping",
            "com.dreamplug.androidapp",
            "in.org.npci.upiapp",
            "com.msf.kbank.mobile",
            "com.axis.mobile",
            "com.icicibank.mobile",
            "com.sbi.upi"
        )

        for (pkg in commonUpiPackages) {
            if (!foundPackages.contains(pkg)) {
                try {
                    val appInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        packageManager.getApplicationInfo(pkg, PackageManager.ApplicationInfoFlags.of(0))
                    } else {
                        @Suppress("DEPRECATION")
                        packageManager.getApplicationInfo(pkg, 0)
                    }
                    foundPackages.add(pkg)
                    val name = packageManager.getApplicationLabel(appInfo).toString()
                    val icon = packageManager.getApplicationIcon(appInfo)
                    val iconBase64 = drawableToBase64(icon)

                    resultList.add(
                        mapOf(
                            "name" to name,
                            "packageName" to pkg,
                            "iconBase64" to iconBase64
                        )
                    )
                } catch (_: Exception) {}
            }
        }

        return resultList
    }

    private fun launchDirectUpiApp(packageName: String, uri: String): Boolean {
        return try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri)).apply {
                setPackage(packageName)
            }
            startActivity(intent)
            true
        } catch (_: Exception) {
            false
        }
    }

    private fun drawableToBase64(drawable: Drawable): String {
        val bitmap = if (drawable is BitmapDrawable && drawable.bitmap != null) {
            drawable.bitmap
        } else {
            val width = drawable.intrinsicWidth.coerceAtLeast(1)
            val height = drawable.intrinsicHeight.coerceAtLeast(1)
            val bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bmp)
            drawable.setBounds(0, 0, canvas.width, canvas.height)
            drawable.draw(canvas)
            bmp
        }

        val stream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
        return Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)
    }
}
