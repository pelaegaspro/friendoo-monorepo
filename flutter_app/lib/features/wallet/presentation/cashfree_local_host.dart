import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';

class CashfreeLocalHost {
  static HttpServer? _activeServer;
  static Timer? _cleanupTimer;

  /// Starts a local loopback HTTP server that serves the Cashfree JS v3 checkout page
  /// with an explicit Content-Type: text/html header so external browsers (Chrome, etc.)
  /// render the payment sheet directly instead of displaying raw HTML source code.
  static Future<String> startCheckoutServer({
    required String paymentSessionId,
    required bool isProduction,
    int? amountInr,
    int? coins,
  }) async {
    await stopCheckoutServer();

    try {
      final server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
      _activeServer = server;

      final mode = isProduction ? 'production' : 'sandbox';
      final displayAmount = amountInr != null ? '₹$amountInr' : '';
      final displayCoins = coins != null ? '+$coins Coins' : '';

      final htmlContent = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Friendoo Secure Checkout</title>
  <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
  <style>
    * { box-sizing: border-box; }
    body {
      background-color: #0B0E17;
      color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .card {
      background: #161B26;
      border: 1px solid #262D40;
      border-radius: 24px;
      padding: 36px 24px;
      text-align: center;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .logo {
      width: 56px;
      height: 56px;
      background: #7C3AED;
      border-radius: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      font-weight: 900;
      font-size: 24px;
      color: #FFFFFF;
    }
    .spinner {
      width: 38px;
      height: 38px;
      border: 3px solid #262D40;
      border-top-color: #EC4899;
      border-radius: 50%;
      animation: spin 0.8s infinite linear;
      margin: 24px auto;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    h2 { margin: 0 0 10px; font-size: 20px; font-weight: 700; }
    p { margin: 0 0 16px; color: #94A3B8; font-size: 14px; line-height: 1.5; }
    .meta { font-size: 13px; color: #10B981; font-weight: 600; margin-bottom: 12px; }
    .btn {
      display: inline-block;
      background: #7C3AED;
      color: white;
      padding: 14px 28px;
      border-radius: 12px;
      font-weight: 700;
      text-decoration: none;
      border: none;
      cursor: pointer;
      font-size: 15px;
      margin-top: 10px;
      box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);
    }
    .btn:active { transform: scale(0.98); }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">F</div>
    <h2>Redirecting to Secure Payment</h2>
    <div class="meta">$displayAmount $displayCoins</div>
    <p>Opening UPI (PhonePe, GPay, Paytm), Cards & NetBanking options…</p>
    <div class="spinner" id="spinner"></div>
    <div id="fallback" style="display:none;">
      <p style="color:#F59E0B;">If payment did not open automatically, tap below:</p>
      <button class="btn" onclick="startCheckout()">Open Payment Options</button>
    </div>
  </div>
  <script>
    const cashfree = Cashfree({ mode: "$mode" });
    function startCheckout() {
      try {
        cashfree.checkout({
          paymentSessionId: "$paymentSessionId",
          redirectTarget: "_self"
        }).then(function(result) {
          if (result && result.error) {
            console.error('Cashfree error:', result.error);
            document.getElementById('spinner').style.display = 'none';
            document.getElementById('fallback').style.display = 'block';
          }
        }).catch(function(err) {
          console.error('Checkout error:', err);
          document.getElementById('spinner').style.display = 'none';
          document.getElementById('fallback').style.display = 'block';
        });
      } catch (err) {
        console.error('Initialization error:', err);
        document.getElementById('spinner').style.display = 'none';
        document.getElementById('fallback').style.display = 'block';
      }
    }
    // Launch automatically
    startCheckout();
    // Reveal button if redirect hasn't happened in 3 seconds
    setTimeout(function() {
      const fb = document.getElementById('fallback');
      if (fb) fb.style.display = 'block';
    }, 3000);
  </script>
</body>
</html>''';

      server.listen((HttpRequest request) {
        if (request.uri.path == '/checkout') {
          request.response
            ..statusCode = HttpStatus.ok
            ..headers.contentType = ContentType.html
            ..headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
            ..headers.set('Pragma', 'no-cache')
            ..write(htmlContent)
            ..close();
        } else {
          request.response
            ..statusCode = HttpStatus.notFound
            ..close();
        }
      }, onError: (e) {
        debugPrint('CashfreeLocalHost request error: $e');
      });

      // Automatically stop server after 5 minutes to release resources
      _cleanupTimer = Timer(const Duration(minutes: 5), () {
        stopCheckoutServer();
      });

      return 'http://127.0.0.1:${server.port}/checkout';
    } catch (e) {
      debugPrint('Failed to start Cashfree local host: $e');
      rethrow;
    }
  }

  /// Stops any running local checkout server
  static Future<void> stopCheckoutServer() async {
    _cleanupTimer?.cancel();
    _cleanupTimer = null;
    try {
      await _activeServer?.close(force: true);
    } catch (_) {}
    _activeServer = null;
  }
}

