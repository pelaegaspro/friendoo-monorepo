# Cashfree Payment Setup — Friendoo

**Status:** Local implementation, regression checks, and the approved live deployment are complete. Cashfree secret configuration and sandbox end-to-end testing remain pending.

## Implemented Architecture

The Flutter client now opens Cashfree checkout through Cashfree’s supported Flutter SDK instead of manually posting a payment session into an application-owned WebView. The client receives only the server-created `provider_order_id`, `payment_session_id`, and environment, then invokes the Cashfree SDK. A Cashfree SDK callback is treated only as a signal to re-check the order; the wallet is credited only after the backend verifies that the Cashfree order is paid. Cashfree requires order creation to occur server-side because the API uses a client secret, and it requires server-side confirmation before goods or services are delivered.[1]

| Layer | Implemented responsibility | Sensitive data exposure |
| --- | --- | --- |
| Flutter wallet UI | Requests a recharge for a server-validated package, opens the Cashfree SDK, and refreshes local wallet data after confirmation. | No Cashfree secret or price authority is present in the app. |
| `payment-create` Edge Function | Reads the server-side package price and coin count, records a pending local order, creates a Cashfree order, and returns its session ID. | Cashfree credentials remain server secrets. |
| `payment-confirm` Edge Function | Fetches the Cashfree order and payment attempts, validates ownership, amount, currency, and paid status, then calls the protected settlement RPC. | No client-side payment status is trusted. |
| `cashfree-webhook` Edge Function | Validates the raw-body HMAC signature and a five-minute millisecond timestamp window, deduplicates events, and applies payment or dispute actions. | Public endpoint; Cashfree signature is mandatory. |
| Database RPCs | Atomically lock the payment order and wallet, apply one credit transaction, and mark the order successful. | Direct client execution is revoked. |

## Local Changes

| File | Change |
| --- | --- |
| `flutter_app/pubspec.yaml` and lock file | Adds `flutter_cashfree_pg_sdk: ^2.4.0+52`, Cashfree’s current Flutter SDK package.[1] |
| `flutter_app/lib/features/wallet/presentation/cashfree_checkout_page.dart` | Replaces the custom `webview_flutter` checkout form with `CFPaymentGatewayService`, `CFSessionBuilder`, and `CFWebCheckoutPaymentBuilder`. |
| `flutter_app/ios/Runner/Info.plist` | Adds Cashfree’s documented UPI application query schemes for iOS.[1] |
| `supabase/functions/payment-create/index.ts` | Updates Cashfree order creation to API version `2026-01-01` and sends the local payment-order UUID as `x-idempotency-key`.[2] |
| `supabase/functions/payment-confirm/index.ts` | Updates Cashfree order confirmation to API version `2026-01-01`. |
| `supabase/functions/cashfree-webhook/index.ts` | Accepts Cashfree’s current `type` field, validates millisecond timestamps, requires the documented webhook-version header, and records `payment_group`. The raw payload remains HMAC-verified before parsing.[3] |
| `flutter_app/test/cashfree_sdk_integration_regression_test.dart` | Adds regression coverage for the SDK handoff, nullable error messages, API version/idempotency, and webhook event mapping. |
| `supabase/functions/cashfree-webhook/cashfree_webhook_contract.test.mjs` | Adds a standalone contract check for Cashfree’s current webhook event, timestamp, and payment-group fields. |

## Production Prerequisites

The current Flutter build is configured for **Friendoo backend `gjbhsogarwqkkftzijhf`**. The database migrations required for payment orders and wallet settlement are present on that backend. The following services are now active: `payment-create` version 1, `payment-confirm` version 1, and `cashfree-webhook` version 6.

| Requirement | Required value or action | Notes |
| --- | --- | --- |
| Cashfree environment | `sandbox` for testing, then `production` only after sign-off | The same environment must be used by create, confirm, and webhook functions. |
| Sandbox secrets | `CASHFREE_SANDBOX_APP_ID`, `CASHFREE_SANDBOX_SECRET_KEY` | Configure as protected Supabase function secrets; never add them to Flutter assets or source control. |
| Production secrets | `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY` | Configure only when production activation is approved. |
| Environment selector | `CASHFREE_ENVIRONMENT=sandbox` or `production` | Default behaviour is sandbox unless the value is exactly `production`. |
| Order services | `payment-create` and `payment-confirm` are deployed to `gjbhsogarwqkkftzijhf` with JWT verification enabled | They are required for the Flutter client’s existing `functions.invoke` calls. |
| Webhook service | `cashfree-webhook` version 6 is deployed with JWT verification disabled | Cashfree must be able to call it publicly; security derives from HTTPS, the HMAC signature, timestamp replay protection, and idempotency. |
| Cashfree dashboard | Register `https://gjbhsogarwqkkftzijhf.supabase.co/functions/v1/cashfree-webhook` as a webhook endpoint | Subscribe to success, failure, and dispute events. Cashfree recommends testing sandbox webhooks first.[3] |
| Webhook version | Create or migrate the dashboard webhook endpoint to `2026-01-01` after validating sandbox events | Cashfree documents webhooks as separately versioned endpoints and recommends a staged migration.[3] |

> **Do not treat the mobile callback as proof of payment.** The callback prompts a backend confirmation. The webhook provides asynchronous settlement coverage, including when the client closes or loses connectivity.

## Validation Completed

| Check | Result |
| --- | --- |
| Cashfree Flutter regression suite | Passed: 5 tests. |
| Cashfree webhook contract suite | Passed: 3 tests. |
| Focused Flutter static analysis | Passed with no issues for the modified checkout and regression test files. |
| Platform compatibility review | Android minimum SDK is 21 and iOS deployment target is 15, meeting Cashfree’s stated Android 19+ and iOS 11+ requirements.[1] |
| Deployment inventory check | Passed: `payment-create` version 1 and `payment-confirm` version 1 are active with JWT verification enabled; `cashfree-webhook` version 6 is active with JWT verification disabled for signed provider callbacks. |

## Sandbox Test Procedure

After the function secrets and three functions are deployed, sign in with a sandbox test account and open **Wallet → select a package → pay**. Confirm that the `payment-create` response includes a non-empty `provider_order_id` and `payment_session_id`, then complete a Cashfree sandbox payment. The Cashfree callback should cause `payment-confirm` to verify the order, and the wallet/transaction providers should refresh only after successful settlement.

Validate a second scenario with the client closed after checkout. The signed Cashfree webhook should settle the payment exactly once. Replaying the same webhook or checking payment confirmation again must not create a second wallet transaction. Finally, test a failed payment and a dispute event to confirm that the order state changes safely and that a dispute freezes the related wallet.

## Deployment Result and Remaining Activation Steps

The approved deployment is complete. `payment-create` and `payment-confirm` are active with JWT verification enabled, while `cashfree-webhook` is active with JWT verification disabled because it authenticates Cashfree callbacks using a raw-payload HMAC signature and replay-window validation.

Before accepting real customer payments, configure the sandbox Cashfree function secrets, set `CASHFREE_ENVIRONMENT=sandbox`, register the documented webhook endpoint in the Cashfree sandbox dashboard, and complete the sandbox test procedure. Production activation must remain disabled until its separate production App ID and Secret Key are securely configured and the sandbox workflow has been verified end-to-end.

## References

[1]: https://www.cashfree.com/docs/payments/online/mobile/flutter "Cashfree Flutter Payment SDK"
[2]: https://www.cashfree.com/docs/api-reference/payments/latest/orders/create-order "Cashfree Create Order API"
[3]: https://www.cashfree.com/docs/payments/webhooks "Cashfree Payment Webhooks"
