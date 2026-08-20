# Flutter, Agora, Supabase, and Cashfree Integration Notes

**Checked:** 15 August 2026

## Confirmed platform and service choices

Agora's official RTC quickstart exposes a Flutter platform option alongside Android, iOS, web, and React Native. Friendoo can therefore retain Agora for its cross-platform RTC layer while moving its app client to Flutter. The call client must still receive server-issued credentials before joining a channel; the existing Firebase Agora-token function will be replaced by the Supabase `agora-token` Edge Function. [1]

Supabase provides the necessary replacement surface for Firebase Auth, Firestore and Cloud Functions: Flutter client support, phone authentication through a configured SMS provider, Postgres with Row Level Security, Realtime, Storage, and TypeScript Edge Functions. Realtime private channels should be used for production signalling and presence. [2]

Cashfree's official verification guidance requires validating the **raw request body**. The Edge Function must read `x-webhook-timestamp` and `x-webhook-signature`, calculate `Base64(HMAC-SHA256(timestamp + rawBody, merchantSecret))`, and compare it before changing any wallet/payment state. [3]

## Sources

[1]: https://docs.agora.io/en/realtime-media/rtc/get-started-sdk "Agora RTC Quickstart"
[2]: https://supabase.com/docs/guides/realtime/getting_started "Supabase Realtime: Getting Started"
[3]: https://www.cashfree.com/docs/payments/online/webhooks/signature-verification "Cashfree Webhook Signature Verification"
