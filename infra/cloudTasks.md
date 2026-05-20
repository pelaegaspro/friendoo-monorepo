## Cloud Tasks setup for Friendoo call billing

This guide provisions the Cloud Tasks queue used by the `billingTick` HTTPS function and configures IAM so **only** Cloud Tasks can invoke it.

### 1) Create the queue (asia-south1)

```bash
gcloud tasks queues create call-billing-queue \
  --location=asia-south1 \
  --max-attempts=5 \
  --min-backoff=10s \
  --max-backoff=60s \
  --max-concurrent-dispatches=500
```

Verify:

```bash
gcloud tasks queues describe call-billing-queue --location=asia-south1
```

### 2) Grant invoker permissions to the Cloud Tasks OIDC service account

For Firebase Functions **Gen 2** (firebase-functions v2), `billingTick` runs as a **Cloud Run service**.
Grant `roles/run.invoker` to the default App Engine service account:

```bash
PROJECT_ID="YOUR_PROJECT_ID"
SERVICE_ACCOUNT="${PROJECT_ID}@appspot.gserviceaccount.com"

gcloud run services add-iam-policy-binding billingTick \
  --region=asia-south1 \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/run.invoker"
```

If your deployment ends up as **Gen 1** for any reason, use:

```bash
gcloud functions add-iam-policy-binding billingTick \
  --region=asia-south1 \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/cloudfunctions.invoker"
```

### 3) OIDC identity used by Cloud Tasks

In this implementation, **each task** is created with an OIDC token:
- `serviceAccountEmail`: `${PROJECT_ID}@appspot.gserviceaccount.com`
- `audience`: the value of `BILLING_TICK_URL`

No queue-level OIDC setting is required; it is set per task in code.

### 4) Firebase environment configuration

Wallet (Cashfree):

Cashfree order creation and webhook handling are in `functions/index.js` (Gen 1 functions).
Configure via environment variables or Firebase Functions config as needed.

Cloud Tasks + billing tick URL:

```bash
firebase functions:config:set \
  cloudtasks.queue="call-billing-queue" \
  cloudtasks.location="asia-south1" \
  cloudtasks.project="YOUR_PROJECT_ID" \
  cloudtasks.billing_tick_url="https://asia-south1-YOUR_PROJECT_ID.cloudfunctions.net/billingTick"
```

### 5) Verify queue is working

List tasks in the queue (may be empty if no active calls):

```bash
gcloud tasks list --queue=call-billing-queue --location=asia-south1
```

### 6) Local testing (Firebase emulator)

Notes:
- Cloud Tasks OIDC verification will reject requests unless the `Authorization: Bearer <OIDC_ID_TOKEN>` is present and valid for the configured audience.
- For local-only manual testing, you can temporarily set `BILLING_TICK_URL` to your emulator URL and provide an OIDC token minted for that audience.

Run emulators:

```bash
firebase emulators:start --only functions,firestore
```

Manual POST (requires a real OIDC ID token with correct audience):

```bash
ID_TOKEN="PASTE_OIDC_ID_TOKEN"
curl -X POST "http://127.0.0.1:5001/YOUR_PROJECT_ID/asia-south1/billingTick/billingTick" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -d '{"callId":"call_123"}'
```

