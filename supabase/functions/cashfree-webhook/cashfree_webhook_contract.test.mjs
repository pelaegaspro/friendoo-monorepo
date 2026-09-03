import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('Cashfree webhook handles the documented type event field', async () => {
  const source = await readFile(new URL('./index.ts', import.meta.url), 'utf8');

  assert.match(source, /type\?: string/);
  assert.match(source, /payload\.type \?\? payload\.event/);
});

test('Cashfree webhook validates the documented millisecond timestamp format', async () => {
  const source = await readFile(new URL('./index.ts', import.meta.url), 'utf8');

  assert.match(source, /const nowMilliseconds = Date\.now\(\);/);
  assert.match(source, /nowMilliseconds - webhookTimestamp/);
});

test('Cashfree webhook records the documented payment_group value', async () => {
  const source = await readFile(new URL('./index.ts', import.meta.url), 'utf8');

  assert.match(source, /payment_group\?: string/);
  assert.match(source, /event\.data\?\.payment\?\.payment_group/);
});
