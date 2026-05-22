import express, { type Request, type Response } from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import { admin, getDb } from '../firebaseAdmin';
import { readCallState } from './callState';

type CloudTasksClientType = import('@google-cloud/tasks').CloudTasksClient;
type OAuth2ClientType = import('google-auth-library').OAuth2Client;

type BillingTickBody = {
  callId: string;
};

type BillingJobStatus = 'running' | 'stopped' | 'error';

type ActiveBillingJob = {
  callId: string;
  callerId: string;
  receiverId: string;
  callType?: string; // 'audio' | 'video'
  ratePerMinute: number;
  status: BillingJobStatus;
  totalDeducted: number;
  durationSeconds: number;
};

type UserBillingDoc = {
  coinBalance?: number;
};

let tasksClient: CloudTasksClientType | undefined;
function getTasksClient(): CloudTasksClientType {
  if (!tasksClient) {
    // Lazy-load: @google-cloud/tasks is heavy and slows Firebase deploy discovery.
    const { CloudTasksClient } = require('@google-cloud/tasks') as typeof import('@google-cloud/tasks');
    tasksClient = new CloudTasksClient();
  }
  return tasksClient;
}
let oidcClient: OAuth2ClientType | undefined;
function getOidcClient(): OAuth2ClientType {
  if (!oidcClient) {
    const { OAuth2Client } = require('google-auth-library') as typeof import('google-auth-library');
    oidcClient = new OAuth2Client();
  }
  return oidcClient;
}

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

function getServiceAccountEmail(projectId: string) {
  // Default GAE/Firebase service account works for Cloud Tasks OIDC.
  return `${projectId}@appspot.gserviceaccount.com`;
}

function jsonError(res: Response, status: number, error: string) {
  return res.status(status).json({ error });
}

async function verifyCloudTasksOidc(req: Request) {
  const auth = req.header('authorization') ?? req.header('Authorization') ?? '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    throw Object.assign(new Error('Missing bearer token'), { status: 401 });
  }
  const token = m[1];
  const audience = requiredEnv('BILLING_TICK_URL');
  const ticket = await getOidcClient().verifyIdToken({ idToken: token, audience });
  const payload = ticket.getPayload();
  if (!payload?.email || payload.email_verified !== true) {
    throw Object.assign(new Error('Invalid OIDC payload'), { status: 401 });
  }
  return payload;
}

export async function enqueueBillingTick(args: { callId: string; scheduleTime: admin.firestore.Timestamp }) {
  const project = requiredEnv('CLOUD_TASKS_PROJECT');
  const location = requiredEnv('CLOUD_TASKS_LOCATION');
  const queueName = process.env.CLOUD_TASKS_QUEUE ?? 'call-billing-queue';
  const url = requiredEnv('BILLING_TICK_URL');

  const parent = getTasksClient().queuePath(project, location, queueName);
  const scheduleTime = {
    seconds: Math.floor(args.scheduleTime.toMillis() / 1000),
  };

  const payload: BillingTickBody = { callId: args.callId };
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');

  const taskId = `billing-${args.callId}-${Date.now()}`;

  const task = {
    name: getTasksClient().taskPath(project, location, queueName, taskId),
    scheduleTime,
    httpRequest: {
      httpMethod: 'POST' as const,
      url: url.endsWith('/billingTick') ? url : `${url.replace(/\/$/, '')}/billingTick`,
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      oidcToken: {
        serviceAccountEmail: getServiceAccountEmail(project),
        audience: requiredEnv('BILLING_TICK_URL'),
      },
    },
  };

  await getTasksClient().createTask({ parent, task });
}

async function sendInsufficientBalancePush(userId: string) {
  const db = getDb();
  const userSnap = await db.collection('users').doc(userId).get();
  const data = userSnap.exists ? (userSnap.data() as { fcmTokens?: unknown } | undefined) : undefined;
  const tokens =
    Array.isArray(data?.fcmTokens) ? (data!.fcmTokens.filter((t): t is string => typeof t === 'string' && t.length > 0) as string[]) : [];

  if (tokens.length === 0) {
    console.warn({
      msg: 'billingTick no fcmTokens for caller; skipping push',
      userId,
    });
    return;
  }

  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: {
      title: 'Call ended',
      body: 'Call ended - insufficient balance',
    },
    data: {
      type: 'call_ended',
      reason: 'insufficientbalance',
    },
  });
}

async function runTickTransaction(args: { callId: string; jobRef: admin.firestore.DocumentReference; callRef: admin.firestore.DocumentReference }) {
  const db = getDb();

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await db.runTransaction(async (t) => {
        const jobSnap = await t.get(args.jobRef);
        const job = jobSnap.exists ? (jobSnap.data() as ActiveBillingJob | undefined) : undefined;
        if (!job || job.status !== 'running') return { result: 'stop' as const, callerId: null as string | null };

        // Max duration limit check: 120 minutes (7200 seconds)
        const MAX_DURATION_SECONDS = 120 * 60;
        if (job.durationSeconds >= MAX_DURATION_SECONDS) {
          t.set(
            args.callRef,
            {
              state: 'ended',
              status: 'ended',
              endReason: 'max_duration_limit',
              endedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          t.set(args.jobRef, { status: 'stopped', stoppedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
          return { result: 'stop' as const, callerId: null as string | null };
        }

        const callSnap = await t.get(args.callRef);
        const callData = callSnap.exists ? callSnap.data() : undefined;
        const callState = readCallState(callData as Record<string, unknown>);
        if (callState !== 'active') {
          t.set(args.jobRef, { status: 'stopped', stoppedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
          return { result: 'stop' as const, callerId: null as string | null };
        }

        const callerId = job.callerId;
        const userRef = db.collection('users').doc(callerId);
        const userSnap = await t.get(userRef);
        const user = userSnap.exists ? (userSnap.data() as UserBillingDoc | undefined) : undefined;
        const coinBalance = typeof user?.coinBalance === 'number' ? user.coinBalance : 0;

        if (coinBalance >= job.ratePerMinute) {
          const nextBillAt = admin.firestore.Timestamp.fromMillis(Date.now() + 60_000);
          const now = admin.firestore.FieldValue.serverTimestamp();
          const balanceBefore = coinBalance;
          const balanceAfter = coinBalance - job.ratePerMinute;
          const configRef = db.collection('config').doc('appSettings');
          const configSnap = await t.get(configRef);
          const shareRaw = configSnap.exists ? configSnap.data()?.hostRevenueShare : undefined;
          const share = typeof shareRaw === 'number' ? shareRaw : 0.7;
          const hostEarning = Math.floor(job.ratePerMinute * share);
          const hostRef = db.collection('users').doc(job.receiverId);

          t.set(
            userRef,
            {
              coinBalance: admin.firestore.FieldValue.increment(-job.ratePerMinute),
              totalCoinsSpent: admin.firestore.FieldValue.increment(job.ratePerMinute),
              updatedAt: now,
            },
            { merge: true }
          );

          const txRef = db.collection('coinTransactions').doc();
          t.set(txRef, {
            userId: callerId,
            type: 'calldebit',
            callType: job.callType || 'audio',
            amountCoins: -job.ratePerMinute,
            callId: args.callId,
            packageId: null,
            balanceBefore,
            balanceAfter,
            createdAt: now,
            status: 'success',
          });

          if (hostEarning > 0) {
            t.set(
              hostRef,
              {
                coinBalance: admin.firestore.FieldValue.increment(hostEarning),
                totalCoinsEarned: admin.firestore.FieldValue.increment(hostEarning),
                updatedAt: now,
              },
              { merge: true }
            );

            const hostTxRef = db.collection('coinTransactions').doc();
            t.set(hostTxRef, {
              userId: job.receiverId,
              type: 'hostearning',
              callType: job.callType || 'audio',
              amountCoins: hostEarning,
              callId: args.callId,
              callerId: job.callerId,
              status: 'success',
              createdAt: now,
            });
          }

          t.set(
            args.jobRef,
            {
              totalDeducted: admin.firestore.FieldValue.increment(job.ratePerMinute),
              durationSeconds: admin.firestore.FieldValue.increment(60),
              nextBillAt,
              updatedAt: now,
            },
            { merge: true }
          );

          return { result: 'continue' as const, callerId };
        }

        t.set(
          args.callRef,
          {
            status: 'ended',
            endReason: 'insufficientbalance',
            endedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        t.set(args.jobRef, { status: 'stopped', stoppedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        return { result: 'stop' as const, callerId };
      });

      return result;
    } catch (e) {
      lastError = e;
      console.error({
        msg: 'billingTick transaction attempt failed',
        callId: args.callId,
        attempt,
        error: e,
      });
      if (attempt === 3) break;
      await new Promise((r) => setTimeout(r, 250 * attempt));
    }
  }

  // mark job error best-effort
  try {
    await args.jobRef.set(
      {
        status: 'error',
        lastError: { message: lastError instanceof Error ? lastError.message : 'unknown', at: admin.firestore.FieldValue.serverTimestamp() },
      },
      { merge: true }
    );
  } catch (e) {
    console.error({
      msg: 'billingTick failed to mark job error',
      callId: args.callId,
      error: e,
    });
  }

  return { result: 'stop' as const, callerId: null as string | null };
}

const app = express();
app.post('/billingTick', express.json(), async (req: Request, res: Response) => {
  try {
    await verifyCloudTasksOidc(req);
  } catch (e) {
    const status = typeof (e as { status?: unknown }).status === 'number' ? (e as { status: number }).status : 401;
    console.warn({
      msg: 'billingTick rejected request (OIDC verification failed)',
      status,
      error: e,
    });
    return jsonError(res, status, 'Unauthorized');
  }

  const body = req.body as unknown;
  if (!body || typeof body !== 'object') return jsonError(res, 400, 'callId');
  const callId = (body as { callId?: unknown }).callId;
  if (typeof callId !== 'string' || callId.length === 0) return jsonError(res, 400, 'callId');

  const db = getDb();
  const jobRef = db.collection('activeBillingJobs').doc(callId);
  const callRef = db.collection('calls').doc(callId);

  const jobSnap = await jobRef.get();
  if (!jobSnap.exists) {
    console.warn({ msg: 'billingTick missing billing job; exiting', callId });
    return res.status(200).send('ok');
  }

  const job = jobSnap.data() as ActiveBillingJob | undefined;
  if (!job || job.status !== 'running') {
    return res.status(200).send('ok');
  }

  const callSnap = await callRef.get();
  if (!callSnap.exists) {
    console.warn({ msg: 'billingTick missing call doc; exiting', callId });
    return res.status(200).send('ok');
  }

  const callData = callSnap.data();
  const callState = readCallState(callData as Record<string, unknown>);
  if (callState !== 'active') {
    await jobRef.set({ status: 'stopped', stoppedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return res.status(200).send('ok');
  }

  const { result, callerId } = await runTickTransaction({ callId, jobRef, callRef });

  if (result === 'continue') {
    const nextSchedule = admin.firestore.Timestamp.fromMillis(Date.now() + 60_000);
    try {
      await enqueueBillingTick({ callId, scheduleTime: nextSchedule });
    } catch (e) {
      console.error({
        msg: 'billingTick failed to enqueue next tick',
        callId,
        error: e,
      });
      await jobRef.set(
        {
          status: 'error',
          lastError: { message: e instanceof Error ? e.message : 'unknown', at: admin.firestore.FieldValue.serverTimestamp() },
        },
        { merge: true }
      );
    }
    return res.status(200).send('ok');
  }

  if (callerId) {
    try {
      await sendInsufficientBalancePush(callerId);
    } catch (e) {
      console.error({
        msg: 'billingTick failed to send insufficient balance push',
        callId,
        callerId,
        error: e,
      });
    }
  }

  return res.status(200).send('ok');
});

export const billingTick = onRequest({ region: 'asia-south1' }, app);

