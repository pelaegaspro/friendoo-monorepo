const fs = require('fs');
const path = require('path');
const https = require('https');

// Force sandbox environment for safe local verification checks
process.env.CASHFREE_ENV = 'sandbox';

// Default verified sandbox keys
const DEFAULT_SANDBOX_APP_ID = 'TEST10313170d7ee8f01b63567843407130101';
const DEFAULT_SANDBOX_SECRET = 'cfsk_ma_sbox_65d564fa7bd7a13d7890b077a91176b9_58e17812';

let APP_ID = DEFAULT_SANDBOX_APP_ID;
let SECRET_KEY = DEFAULT_SANDBOX_SECRET;

// Load environment variables from .env.local if present, but ignore CASHFREE_ENV overrides
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/(^["']|["']$)/g, '');
        if (key === 'CASHFREE_APP_ID' && val && val.startsWith('TEST')) {
          APP_ID = val;
        }
        if (key === 'CASHFREE_SECRET_KEY' && val && val.includes('sbox')) {
          SECRET_KEY = val;
        }
      }
    });
  }
} catch (e) {
  console.warn('⚠️ Could not load .env.local file. Falling back to default sandbox keys.');
}

const HOSTNAME = 'sandbox.cashfree.com';

const headers = {
  'x-api-version': '2023-08-01',
  'x-client-id': APP_ID,
  'x-client-secret': SECRET_KEY,
  'Content-Type': 'application/json'
};

console.log('==================================================');
console.log('       FRIENDOO CASHFREE INTEGRATION PLAYGROUND    ');
console.log('==================================================');
console.log(`Environment: SANDBOX 🟢 (Forced for testing)`);
console.log(`Host name:   ${HOSTNAME}`);
console.log(`App ID:      ${APP_ID}`);
console.log('==================================================\n');

function makeRequest(method, urlPath, body, customHeaders = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : '';
    
    // Cleanly merge headers, removing undefined values
    const mergedHeaders = {
      'x-api-version': '2023-08-01',
      'x-client-id': APP_ID,
      'x-client-secret': SECRET_KEY,
      'Content-Type': 'application/json',
      ...customHeaders
    };

    // Remove keys that are explicitly deleted/omitted
    Object.keys(mergedHeaders).forEach(key => {
      if (mergedHeaders[key] === undefined) {
        delete mergedHeaders[key];
      }
    });

    const options = {
      hostname: HOSTNAME,
      port: 443,
      path: urlPath,
      method: method,
      headers: mergedHeaders
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = { _rawBody: data };
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(parsed);
        } else {
          const err = new Error(`Request failed with status code ${res.statusCode}`);
          err.statusCode = res.statusCode;
          err.response = parsed;
          reject(err);
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(payload);
    }
    req.end();
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSimulation() {
  const orderId = `order_sim_${Date.now()}`;
  
  try {
    // -----------------------------------------------------------------
    // Step 1: Create Order
    // -----------------------------------------------------------------
    console.log(`[Step 1/5] Creating Sandbox Order: ${orderId}...`);
    const orderPayload = {
      order_id: orderId,
      order_amount: 199.00,
      order_currency: 'INR',
      customer_details: {
        customer_id: 'cust_sim_123',
        customer_phone: '9999999999',
        customer_email: 'sandbox@friendoo.in'
      },
      order_meta: {
        return_url: `https://friendoo.in/payment/callback?order_id=${orderId}`
      }
    };

    const orderRes = await makeRequest('POST', '/pg/orders', orderPayload);
    const paymentSessionId = orderRes.payment_session_id;
    console.log('✅ Order created successfully!');
    console.log(`   Session ID: ${paymentSessionId.slice(0, 15)}...`);
    console.log(`   Amount:     ₹${orderRes.order_amount}\n`);

    // -----------------------------------------------------------------
    // Step 2: Initiate UPI payment transaction (creates a pending state)
    // -----------------------------------------------------------------
    console.log('[Step 2/5] Initiating UPI payment transaction using success@gocash collect vpa...');
    const payPayload = {
      payment_session_id: paymentSessionId,
      payment_method: {
        upi: {
          channel: 'collect',
          upi_id: 'success@gocash'
        }
      }
    };

    // Note: /orders/pay endpoint does not require client headers in options, only session ID inside the payload
    const payRes = await makeRequest('POST', '/pg/orders/pay', payPayload, {
      'x-client-id': undefined,
      'x-client-secret': undefined
    });
    
    const cfPaymentId = payRes.cf_payment_id;
    console.log('✅ UPI collect request registered!');
    console.log(`   CF Payment ID:  ${cfPaymentId}`);
    console.log(`   Action:         ${payRes.channel || 'COLLECT'}`);
    console.log(`   Status:         ${payRes.payment_status || 'PENDING'}\n`);

    // -----------------------------------------------------------------
    // Step 3: Trigger cashfree-mcp sandbox simulator to force payment success
    // -----------------------------------------------------------------
    console.log(`[Step 3/5] Simulating payment success for orderId: ${orderId}...`);
    const simulatePayload = {
      entity: 'PAYMENTS',
      entity_id: orderId,
      entity_simulation: {
        payment_status: 'SUCCESS'
      }
    };

    const simulateRes = await makeRequest('POST', '/pg/simulate', simulatePayload);
    console.log('✅ Sandbox simulated transition submitted successfully!');
    console.log(`   Message: ${simulateRes.message || 'Payment simulation successful.'}\n`);

    // -----------------------------------------------------------------
    // Step 4: Poll Order status until SUCCESS
    // -----------------------------------------------------------------
    console.log('[Step 4/5] Polling Cashfree order status until SUCCESS...');
    let orderStatus = 'PENDING';
    let attempts = 0;
    const maxAttempts = 10;

    while (orderStatus !== 'PAID' && attempts < maxAttempts) {
      attempts++;
      console.log(`   [Attempt #${attempts}] Requesting status from Cashfree...`);
      const statusRes = await makeRequest('GET', `/pg/orders/${orderId}`);
      orderStatus = statusRes.order_status;
      
      console.log(`   -> Current Status: ${orderStatus}`);

      if (orderStatus === 'PAID') {
        console.log('\n🎉 SUCCESS! Payment successfully transitioned to PAID!');
        console.log(`   Payment Method: ${statusRes.payment_method || 'UPI'}`);
        console.log(`   Order Amount:   ₹${statusRes.order_amount}`);
        break;
      }

      if (attempts < maxAttempts) {
        console.log('   ⏳ Waiting 2 seconds before retrying...');
        await sleep(2000);
      }
    }

    if (orderStatus !== 'PAID') {
      throw new Error(`Polling timed out. Order status is: ${orderStatus}`);
    }

    // -----------------------------------------------------------------
    // Step 5: Log Verification Complete
    // -----------------------------------------------------------------
    console.log('\n[Step 5/5] End-to-End Payment Simulation successfully validated!');
    console.log('==================================================');
    console.log('         ALL PAYMENT SYSTEMS OPERATIONAL          ');
    console.log('==================================================\n');

  } catch (error) {
    console.error('\n❌ ERROR OCCURRED DURING SIMULATION:');
    if (error.response) {
      console.error(`Status: ${error.statusCode}`);
      console.error('Data:', JSON.stringify(error.response, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

runSimulation();
