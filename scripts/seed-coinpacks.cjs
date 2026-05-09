// Seed 8 coin packs into Firestore (both coinPacks + coinPackages collections)
// Run: node seed-coinpacks.js
// Requires: FIREBASE_SERVICE_ACCOUNT_JSON env var, OR GOOGLE_APPLICATION_CREDENTIALS

const admin = require('firebase-admin')

function initAdmin() {
  if (admin.apps.length) return admin.app()

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (raw && raw !== '{}') {
    try {
      const sa = JSON.parse(raw)
      if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n')
      admin.initializeApp({ credential: admin.credential.cert(sa) })
      return admin.app()
    } catch (e) {
      console.warn('Could not parse FIREBASE_SERVICE_ACCOUNT_JSON:', e.message)
    }
  }

  // Fallback: applicationDefault (requires GOOGLE_APPLICATION_CREDENTIALS or gcloud login)
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'friendoo-v1',
  })
  return admin.app()
}

const PACKS = [
  { displayName: 'Trial',   priceInr: 29,  coins: 25,  bonus: 0   },
  { displayName: 'Basic',   priceInr: 50,  coins: 50,  bonus: 0   },
  { displayName: 'Lite',    priceInr: 75,  coins: 75,  bonus: 5   },
  { displayName: 'Starter', priceInr: 99,  coins: 99,  bonus: 11  },
  { displayName: 'Regular', priceInr: 150, coins: 150, bonus: 25  },
  { displayName: 'Value',   priceInr: 249, coins: 249, bonus: 51  },
  { displayName: 'Plus',    priceInr: 350, coins: 350, bonus: 100 },
  { displayName: 'Premium', priceInr: 499, coins: 499, bonus: 151 },
]

async function seed() {
  initAdmin()
  const db = admin.firestore()
  const ts = admin.firestore.FieldValue.serverTimestamp()

  for (const pack of PACKS) {
    const payload = {
      ...pack,
      active: true,
      updatedAt: ts,
    }

    // Write to coinPacks (read by client app)
    const cpRef = db.collection('coinPacks').doc(pack.displayName.toLowerCase())
    await cpRef.set({ ...payload, createdAt: ts }, { merge: true })
    console.log(`[coinPacks]    ${pack.displayName} ₹${pack.priceInr} → ${pack.coins + pack.bonus} coins ✓`)

    // Write to coinPackages (managed by admin panel)
    const cpkRef = db.collection('coinPackages').doc(pack.displayName.toLowerCase())
    await cpkRef.set({ ...payload, createdAt: ts }, { merge: true })
    console.log(`[coinPackages] ${pack.displayName} ₹${pack.priceInr} → ${pack.coins + pack.bonus} coins ✓`)
  }

  console.log('\nAll 8 coin packs seeded successfully!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
