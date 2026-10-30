const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Handle Cashfree checkout redirect if session_id is provided
  const sessionId = parsedUrl.searchParams.get('session_id');
  if (pathname.includes('/checkout') || sessionId) {
    if (!sessionId) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('Missing session_id parameter');
    }
    const env = parsedUrl.searchParams.get('env') === 'sandbox' ? 'sandbox' : 'production';
    const amountVal = parsedUrl.searchParams.get('amount');
    const coinsVal = parsedUrl.searchParams.get('coins');
    const amount = amountVal ? `₹${amountVal}` : '';
    const coins = coinsVal ? `+${coinsVal} Coins` : '';

    const checkoutHtml = `<!DOCTYPE html>
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
    .meta { font-size: 14px; color: #10B981; font-weight: 700; margin-bottom: 14px; }
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
    <div class="meta">${amount} ${coins}</div>
    <p>Opening UPI (PhonePe, GPay, Paytm), Cards & NetBanking options…</p>
    <div class="spinner" id="spinner"></div>
    <div id="fallback" style="display:none;">
      <p style="color:#F59E0B;">If payment did not open automatically, tap below:</p>
      <button class="btn" onclick="startCheckout()">Open Payment Options</button>
    </div>
  </div>
  <script>
    const cashfree = Cashfree({ mode: "${env}" });
    function startCheckout() {
      try {
        cashfree.checkout({
          paymentSessionId: "${sessionId}",
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
    startCheckout();
    setTimeout(function() {
      const fb = document.getElementById('fallback');
      if (fb) fb.style.display = 'block';
    }, 3000);
  </script>
</body>
</html>`;

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    });
    return res.end(checkoutHtml);
  }

  // Static file serving
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(__dirname, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'text/html; charset=utf-8';

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('Internal Server Error');
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'public, max-age=60' : 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Friendoo Website running at http://localhost:${PORT}`);
});

