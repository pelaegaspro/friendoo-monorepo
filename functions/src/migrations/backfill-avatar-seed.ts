import * as admin from 'firebase-admin'

/**
 * One-time migration: backfill avatarSeed on all users/ and hosts/ documents
 * where avatarSeed is missing or empty.
 *
 * avatarSeed = uid (document ID), set once and never changes.
 *
 * Run with: npx ts-node src/migrations/backfill-avatar-seed.ts
 * Or deploy as a one-off Cloud Function.
 */
export async function backfillAvatarSeed(): Promise<{ usersUpdated: number; hostsUpdated: number }> {
  const db = admin.firestore()
  let usersUpdated = 0
  let hostsUpdated = 0

  // Backfill users/{uid}
  const usersSnap = await db.collection('users').get()
  const userBatch = db.batch()
  for (const doc of usersSnap.docs) {
    const data = doc.data()
    if (!data.avatarSeed) {
      userBatch.update(doc.ref, { avatarSeed: doc.id })
      usersUpdated++
    }
  }
  if (usersUpdated > 0) {
    await userBatch.commit()
  }

  // Backfill hosts/{hostId}
  const hostsSnap = await db.collection('hosts').get()
  const hostBatch = db.batch()
  for (const doc of hostsSnap.docs) {
    const data = doc.data()
    if (!data.avatarSeed) {
      hostBatch.update(doc.ref, { avatarSeed: doc.id })
      hostsUpdated++
    }
  }
  if (hostsUpdated > 0) {
    await hostBatch.commit()
  }

  console.log(`Migration complete: ${usersUpdated} users, ${hostsUpdated} hosts updated.`)
  return { usersUpdated, hostsUpdated }
}
