import { onSchedule } from 'firebase-functions/v2/scheduler';
import { admin, getDb } from '../firebaseAdmin';
import { readCallState, TERMINAL_CALL_STATES } from '../calls/callState';

const STALE_MS = 90_000;
const CONNECTING_TIMEOUT_MS = 60_000;
const MAX_DURATION_MS = 120 * 60 * 1000; // 2 hours

/**
 * Robust multi-stage server-authoritative reconciliation and self-healing engine.
 * Sweeps stale heartbeats, stuck call signalings, orphan billing jobs, and inconsistent host locks.
 */
export const presenceJanitor = onSchedule(
  { schedule: 'every 1 minutes', region: 'asia-south1', timeZone: 'Asia/Kolkata' },
  async () => {
    const db = getDb();
    const now = admin.firestore.Timestamp.now();
    const cutoff = admin.firestore.Timestamp.fromMillis(now.toMillis() - STALE_MS);
    const connectingCutoff = admin.firestore.Timestamp.fromMillis(now.toMillis() - CONNECTING_TIMEOUT_MS);
    const maxDurationCutoff = admin.firestore.Timestamp.fromMillis(now.toMillis() - MAX_DURATION_MS);

    const batch = db.batch();
    let count = 0;
    const callRefsToFetch: admin.firestore.DocumentReference[] = [];

    // ==========================================
    // STAGE 1: STALE HEARTBEATS & GHOST HOSTS
    // ==========================================
    const presenceSnap = await db
      .collection('presence')
      .where('status', 'in', ['online', 'busy'])
      .limit(200)
      .get();

    for (const doc of presenceSnap.docs) {
      const data = doc.data();
      const hb = data.heartbeatAt as admin.firestore.Timestamp | undefined;
      const uid = doc.id;

      if (!hb || hb.toMillis() < cutoff.toMillis()) {
        // Stale heartbeat detected: Force offline
        batch.set(
          doc.ref,
          {
            status: 'offline',
            activeCallId: admin.firestore.FieldValue.delete(),
            lastSeen: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        const hostMirror = {
          isOnline: false,
          callStatus: 'offline',
          activeCallId: admin.firestore.FieldValue.delete(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        batch.set(db.collection('hosts').doc(uid), hostMirror, { merge: true });
        batch.set(db.collection('users').doc(uid), hostMirror, { merge: true });
        count++;

        const activeCallId = data.activeCallId as string | undefined;
        if (activeCallId) {
          callRefsToFetch.push(db.collection('calls').doc(activeCallId));
        }
      }
    }

    // ==========================================
    // STAGE 2: FORCE END STALE GHOST CALLS
    // ==========================================
    if (callRefsToFetch.length > 0) {
      const uniqueRefs = Array.from(new Set(callRefsToFetch.map(r => r.id)))
        .map(id => db.collection('calls').doc(id));
      
      const callSnaps = await db.getAll(...uniqueRefs);
      for (const callSnap of callSnaps) {
        if (callSnap.exists) {
          const callData = callSnap.data();
          const callState = readCallState(callData as Record<string, unknown>);
          if (!TERMINAL_CALL_STATES.includes(callState)) {
            batch.update(callSnap.ref, {
              state: 'ended',
              status: 'ended',
              endReason: 'presence_timeout',
              endedAt: admin.firestore.FieldValue.serverTimestamp(),
              terminalStateProcessed: true,
            });

            // Make sure the active billing job associated is also closed
            batch.set(
              db.collection('activeBillingJobs').doc(callSnap.id),
              { status: 'stopped', stoppedAt: admin.firestore.FieldValue.serverTimestamp() },
              { merge: true }
            );
          }
        }
      }
    }

    // ==========================================
    // STAGE 3: STUCK CONNECTING & RUNAWAY CALLS
    // ==========================================
    const activeCallsSnap = await db.collection('calls')
      .where('state', 'in', ['connecting', 'accepted', 'active'])
      .limit(100)
      .get();

    const participantUids = new Set<string>();
    activeCallsSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.callerId) participantUids.add(data.callerId);
      if (data.hostId) participantUids.add(data.hostId);
    });

    // Bulk-fetch participant presences to check heartbeat freshness
    const presenceMap = new Map<string, admin.firestore.Timestamp>();
    if (participantUids.size > 0) {
      const presenceRefs = Array.from(participantUids).map(uid => db.collection('presence').doc(uid));
      const snaps = await db.getAll(...presenceRefs);
      snaps.forEach(snap => {
        if (snap.exists) {
          const data = snap.data()!;
          if (data.heartbeatAt) {
            presenceMap.set(snap.id, data.heartbeatAt as admin.firestore.Timestamp);
          }
        }
      });
    }

    for (const doc of activeCallsSnap.docs) {
      const data = doc.data();
      const state = readCallState(data as Record<string, unknown>);
      const callId = doc.id;
      const hostId = (data.hostId as string) || '';
      const callerId = (data.callerId as string) || '';

      // Stuck Connecting Timeout (> 60s in accepted/connecting without transitioning to active)
      if (state === 'connecting' || state === 'accepted') {
        const ringingAt = data.ringingAt as admin.firestore.Timestamp | undefined;
        const acceptedAt = data.acceptedAt as admin.firestore.Timestamp | undefined;
        const ts = acceptedAt || ringingAt || data.createdAt as admin.firestore.Timestamp;
        
        if (ts && ts.toMillis() < connectingCutoff.toMillis()) {
          batch.update(doc.ref, {
            state: 'failed',
            status: 'failed',
            endReason: 'reconnect_timeout',
            endedAt: admin.firestore.FieldValue.serverTimestamp(),
            terminalStateProcessed: true,
          });

          batch.set(
            db.collection('activeBillingJobs').doc(callId),
            { status: 'stopped', stoppedAt: admin.firestore.FieldValue.serverTimestamp() },
            { merge: true }
          );

          if (hostId) {
            batch.set(db.collection('presence').doc(hostId), {
              status: 'online',
              activeCallId: admin.firestore.FieldValue.delete(),
              lastSeen: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
          }
          continue;
        }
      }

      // Max Duration Limit Check (> 2 hours runaway call safety)
      if (state === 'active') {
        const startedAt = data.startedAt || data.acceptedAt as admin.firestore.Timestamp;
        if (startedAt && startedAt.toMillis() < maxDurationCutoff.toMillis()) {
          batch.update(doc.ref, {
            state: 'ended',
            status: 'ended',
            endReason: 'max_duration_limit',
            endedAt: admin.firestore.FieldValue.serverTimestamp(),
            terminalStateProcessed: true,
          });

          batch.set(
            db.collection('activeBillingJobs').doc(callId),
            { status: 'stopped', stoppedAt: admin.firestore.FieldValue.serverTimestamp() },
            { merge: true }
          );

          if (hostId) {
            batch.set(db.collection('presence').doc(hostId), {
              status: 'online',
              activeCallId: admin.firestore.FieldValue.delete(),
              lastSeen: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
          }
          continue;
        }

        // Participant Heartbeat Freshness check (if either goes offline for > 90s, terminate)
        const callerHb = presenceMap.get(callerId);
        const hostHb = presenceMap.get(hostId);

        if ((callerHb && callerHb.toMillis() < cutoff.toMillis()) || (hostHb && hostHb.toMillis() < cutoff.toMillis())) {
          batch.update(doc.ref, {
            state: 'ended',
            status: 'ended',
            endReason: 'presence_timeout',
            endedAt: admin.firestore.FieldValue.serverTimestamp(),
            terminalStateProcessed: true,
          });

          batch.set(
            db.collection('activeBillingJobs').doc(callId),
            { status: 'stopped', stoppedAt: admin.firestore.FieldValue.serverTimestamp() },
            { merge: true }
          );

          if (hostId) {
            batch.set(db.collection('presence').doc(hostId), {
              status: 'online',
              activeCallId: admin.firestore.FieldValue.delete(),
              lastSeen: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
          }
        }
      }
    }

    // ==========================================
    // STAGE 4: ABANDONED BILLING JOBS CLEANUP
    // ==========================================
    const runningBillingJobsSnap = await db.collection('activeBillingJobs')
      .where('status', '==', 'running')
      .limit(100)
      .get();

    if (!runningBillingJobsSnap.empty) {
      const activeBillingRefs = runningBillingJobsSnap.docs.map(doc => db.collection('calls').doc(doc.id));
      const activeBillingCallSnaps = await db.getAll(...activeBillingRefs);
      
      for (const callSnap of activeBillingCallSnaps) {
        if (callSnap.exists) {
          const callData = callSnap.data()!;
          const callState = readCallState(callData as Record<string, unknown>);
          if (TERMINAL_CALL_STATES.includes(callState)) {
            batch.set(
              db.collection('activeBillingJobs').doc(callSnap.id),
              { status: 'stopped', stoppedAt: admin.firestore.FieldValue.serverTimestamp() },
              { merge: true }
            );
          }
        } else {
          // Orphan job without call doc
          batch.set(
            db.collection('activeBillingJobs').doc(callSnap.id),
            { status: 'stopped', stoppedAt: admin.firestore.FieldValue.serverTimestamp() },
            { merge: true }
          );
        }
      }
    }

    // ==========================================
    // STAGE 5: MIRROR CONSISTENCY AUDITING
    // ==========================================
    const activeHostsSnap = await db.collection('hosts')
      .where('callStatus', '==', 'busy')
      .limit(100)
      .get();

    if (!activeHostsSnap.empty) {
      const hostPresenceRefs = activeHostsSnap.docs.map(doc => db.collection('presence').doc(doc.id));
      const hostPresenceSnaps = await db.getAll(...hostPresenceRefs);

      for (const snap of hostPresenceSnaps) {
        if (snap.exists) {
          const pData = snap.data()!;
          if (pData.status === 'online' && !pData.activeCallId) {
            // Presence is online/available but mirror is marked busy! Auto-repair
            const hostMirror = {
              isOnline: true,
              callStatus: 'available',
              activeCallId: admin.firestore.FieldValue.delete(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            batch.set(db.collection('hosts').doc(snap.id), hostMirror, { merge: true });
            batch.set(db.collection('users').doc(snap.id), hostMirror, { merge: true });
          } else if (pData.status === 'offline') {
            // Presence is offline but mirror is marked busy! Auto-repair
            const hostMirror = {
              isOnline: false,
              callStatus: 'offline',
              activeCallId: admin.firestore.FieldValue.delete(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            batch.set(db.collection('hosts').doc(snap.id), hostMirror, { merge: true });
            batch.set(db.collection('users').doc(snap.id), hostMirror, { merge: true });
          }
        }
      }
    }

    if (count > 0 || callRefsToFetch.length > 0 || runningBillingJobsSnap.size > 0 || activeCallsSnap.size > 0) {
      await batch.commit();
    }

    console.log({
      msg: 'presenceJanitor complete',
      staleCleared: count,
      callsTerminated: callRefsToFetch.length,
      activeCallsAudited: activeCallsSnap.size,
      billingJobsAudited: runningBillingJobsSnap.size
    });
  }
);
