-- Deduplicate coin packages and remap historical payment orders to canonical pkg_* IDs

-- Step 1: Remap payment_orders foreign keys
UPDATE public.payment_orders SET package_id = 'pkg_15' WHERE package_id = 'base_15';
UPDATE public.payment_orders SET package_id = 'pkg_25' WHERE package_id = 'base_25';
UPDATE public.payment_orders SET package_id = 'pkg_50' WHERE package_id = 'base_50';
UPDATE public.payment_orders SET package_id = 'pkg_100' WHERE package_id IN ('base_100', 'starter_100');
UPDATE public.payment_orders SET package_id = 'pkg_140' WHERE package_id = 'offer_140';
UPDATE public.payment_orders SET package_id = 'pkg_200' WHERE package_id = 'offer_200';
UPDATE public.payment_orders SET package_id = 'pkg_300' WHERE package_id = 'offer_300';
UPDATE public.payment_orders SET package_id = 'pkg_500' WHERE package_id IN ('offer_500', 'value_550');
UPDATE public.payment_orders SET package_id = 'pkg_900' WHERE package_id = 'offer_900';

-- Step 2: Delete duplicate & obsolete packages
DELETE FROM public.coin_packages 
WHERE id IN (
  'base_15', 'base_25', 'base_50', 'base_100', 'starter_100',
  'offer_140', 'offer_200', 'offer_300', 'offer_500', 'value_550',
  'offer_900', 'plus_1200', 'offer_1900', 'offer_9800', 'offer_15000'
);

