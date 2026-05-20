const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'friendoo-v1',
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

async function migrateCollection(collectionName) {
  const snap = await db.collection(collectionName).get();
  let migrated = 0;
  let skipped = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (!data.avatarSeed) {
      await doc.ref.update({ avatarSeed: doc.id });
      migrated++;
    } else {
      skipped++;
    }
  }

  console.log(`${collectionName}: migrated=${migrated}, already had avatarSeed=${skipped}`);
}

async function main() {
  console.log('Starting avatarSeed migration...');
  await migrateCollection('users');
  await migrateCollection('hosts');
  console.log('Migration complete.');
}

main().catch(console.error);
