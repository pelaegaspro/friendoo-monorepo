-- Clear all mock / development wallet transactions
-- These 33 transactions were generated during WebRTC call tests and manual admin testing
-- between 'Realtime Test User', 'Realtime Test Host', and 'Friendoo Admin'

DELETE FROM public.wallet_transactions
WHERE user_id IN (
  'c95a4029-ada4-4b30-a9c3-df8c606e57e7',
  '6f67f287-0e9c-4c72-891b-c045cafc17cf',
  '00000000-0000-4000-8000-000000000001'
);

-- Reset mock test balances to 0
UPDATE public.wallets
SET coin_balance = 0,
    updated_at = NOW()
WHERE user_id IN (
  'c95a4029-ada4-4b30-a9c3-df8c606e57e7',
  '6f67f287-0e9c-4c72-891b-c045cafc17cf',
  '00000000-0000-4000-8000-000000000001'
);

