const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const admin = require('../functions/node_modules/firebase-admin');
const axios = require('../functions/node_modules/axios');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'friendoo-v1'
});
const db = admin.firestore();

const WEBHOOK_URL = 'https://cashfreewebhook-3cckwwzewa-el.a.run.app';
const WEBHOOK_SECRET = 'test_secret_123';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('==================================================');
  console.log('       FRIENDOO WEBHOOK & COIN CREDITING TEST      ');
  console.log('==================================================\n');

  const userId = `test_user_${Date.now()}`;
  const orderId = `order_test_${Date.now()}`;
  const packageId = 'test_pack_150';

  try {
    // 1. Create a test user document in Firestore
    console.log(`[Step 1/6] Creating test user document: ${userId}...`);
    const userRef = db.collection('users').doc(userId);
    await userRef.set({
      uid: userId,
      displayName: 'Sandbox Tester',
      coinBalance: 100,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ User document created with initial balance: 100 coins.\n');

    // 2. Create a pending coin transaction document in Firestore
    console.log(`[Step 2/6] Creating pending transaction: ${orderId}...`);
    const txRef = db.collection('coinTransactions').doc();
    await txRef.set({
      userId: userId,
      type: 'topup',
      status: 'pending',
      cashfreeOrderId: orderId,
      packageId: packageId,
      amountInr: 199.00,
      currency: 'INR',
      amountCoins: 150,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    const txId = txRef.id;
    console.log(`... Pending transaction created in Firestore (ID: ${txId}).\n`);

    // 3. Prepare Cashfree PAYMENT_SUCCESS webhook payload
    console.log('[Step 3/6] Formulating simulated PAYMENT_SUCCESS webhook payload...');
    const payloadObj = {
      event: 'PAYMENT_SUCCESS_WEBHOOK',
      data: {
        order: {
          order_id: orderId,
          order_amount: 199.00,
          order_currency: 'INR',
          order_status: 'PAID',
          customer_details: {
            customer_id: userId,
            customer_email: 'sandbox@friendoo.in',
            customer_phone: '9999999999'
          }
        },
        payment: {
          cf_payment_id: 'cf_pay_sim_987654321',
          payment_status: 'SUCCESS',
          payment_amount: 199.00,
          payment_currency: 'INR',
          payment_method: 'upi',
          payment_time: new Date().toISOString()
        }
      }
    };
    const rawBody = JSON.stringify(payloadObj);

    // 4. Generate cryptographic HMAC-SHA256 signature using test_secret_123
    console.log('[Step 4/6] Generating cryptographic signature using webhook secret...');
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signedPayload = timestamp + rawBody;
    const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(signedPayload).digest('base64');
    console.log(`   Timestamp: ${timestamp}`);
    console.log(`   Signature: ${signature}\n`);

    // 5. POST to the deployed cloud function webhook endpoint
    console.log(`[Step 5/6] Dispatching webhook to deployed URL: ${WEBHOOK_URL}...`);
    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Timestamp': timestamp
    };

    const webhookRes = await axios.post(WEBHOOK_URL, rawBody, { headers });
    console.log('✅ Webhook delivery request executed!');
    console.log(`   Response Status: ${webhookRes.status}`);
    console.log('   Response Data:  ', JSON.stringify(webhookRes.data, null, 2), '\n');

    // 6. Poll Firestore to verify transaction success and coin balance updates
    console.log('[Step 6/6] Polling Firestore to confirm coin balance credit...');
    let success = false;
    const maxAttempts = 10;
    for (let attempts = 1; attempts <= maxAttempts; attempts++) {
      console.log(`   [Attempt #${attempts}] Fetching user and transaction documents...`);
      const userSnap = await userRef.get();
      const txSnap = await db.collection('coinTransactions').doc(txId).get();

      const userData = userSnap.data();
      const txData = txSnap.data();

      console.log(`   -> Transaction Status: ${txData?.status}`);
      console.log(`   -> User Coin Balance:   ${userData?.coinBalance} coins`);

      if (txData?.status === 'success' && userData?.coinBalance === 250) {
        console.log('\n🎉 SUCCESS! Firestore state transitions verified!');
        console.log(`   Transaction is marked SUCCESS.`);
        console.log(`   User coin balance was credited 150 coins (New Balance: 250).`);
        success = true;
        break;
      }

      if (attempts < maxAttempts) {
        console.log('   ⏳ Waiting 1.5 seconds before polling again...');
        await sleep(1500);
      }
    }

    if (!success) {
      throw new Error('Verification timed out. Webhook was not processed or balance not updated.');
    }

    // Clean up created documents
    console.log('\n🧹 Cleaning up test documents...');
    await userRef.delete();
    await db.collection('coinTransactions').doc(txId).delete();
    // Also delete any entries generated in the transactions collection
    const transactionsSnap = await db.collection('transactions')
      .where('cashfreeOrderId', '==', orderId)
      .get();
    for (const doc of transactionsSnap.docs) {
      await doc.ref.delete();
    }
    console.log('✅ Clean up complete.');
    console.log('==================================================');
    console.log('     END-TO-END WEBHOOK INTEGRATION VALIDATED     ');
    console.log('==================================================\n');

  } catch (error) {
    console.error('\n❌ ERROR OCCURRED DURING WEBHOOK DELIVERY TEST:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }

    // Attempt clean up anyway
    try {
      await db.collection('users').doc(userId).delete();
      const txSnap = await db.collection('coinTransactions').where('cashfreeOrderId', '==', orderId).get();
      for (const doc of txSnap.docs) {
        await doc.ref.delete();
      }
      const transactionsSnap = await db.collection('transactions').where('cashfreeOrderId', '==', orderId).get();
      for (const doc of transactionsSnap.docs) {
        await doc.ref.delete();
      }
    } catch (e) {}

    process.exit(1);
  }
}

run();
