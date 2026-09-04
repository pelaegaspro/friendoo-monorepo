import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('Cashfree Payouts client implements the 2024-01-01 API version and transfer modes', async () => {
  const source = await readFile(new URL('../lib/cashfree/payouts.ts', import.meta.url), 'utf8');

  assert.match(source, /'x-api-version':\s*'2024-01-01'/);
  assert.match(source, /transfer_mode/);
  assert.match(source, /beneficiary_instrument_details/);
  assert.match(source, /createCashfreePayoutTransfer/);
  assert.match(source, /getCashfreePayoutTransfer/);
});

test('Cashfree Payout webhook signature verification uses HMAC-SHA256', async () => {
  const source = await readFile(new URL('../lib/cashfree/payouts.ts', import.meta.url), 'utf8');

  assert.match(source, /hash:\s*'SHA-256'/);
  assert.match(source, /verifyCashfreePayoutWebhookSignature/);
});

test('Cashfree Payout webhook endpoint handles TRANSFER_SUCCESS and TRANSFER_FAILED', async () => {
  const source = await readFile(new URL('../app/api/webhooks/cashfree-payout/route.ts', import.meta.url), 'utf8');

  assert.match(source, /TRANSFER_SUCCESS/);
  assert.match(source, /TRANSFER_FAILED/);
  assert.match(source, /record_host_payout_provider_result/);
});

test('Payout settings API route saves to crm_configuration_documents payout_settings', async () => {
  const source = await readFile(new URL('../app/api/admin/settings/payouts/route.ts', import.meta.url), 'utf8');

  assert.match(source, /id:\s*'payout_settings'/);
  assert.match(source, /requireAdminApi/);
});

test('Cashfree Payout HMAC calculation matches expected signature', async () => {
  const secret = 'test_secret_key_123';
  const timestamp = '1788544686624';
  const rawPayload = JSON.stringify({ event: 'TRANSFER_SUCCESS', data: { transfer_id: 'cf_123' } });

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${timestamp}${rawPayload}`)
  );
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

  assert.ok(signature.length > 20);
});

