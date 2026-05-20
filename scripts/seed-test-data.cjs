const admin = require('firebase-admin');

// Use default credentials from Firebase CLI login
admin.initializeApp({
  projectId: 'friendoo-v1',
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

async function seed() {
  const batch = db.batch();

  // Add 1 test user
  const userRef = db.collection('users').doc('test-user-001');
  batch.set(userRef, {
    uid: 'test-user-001',
    alias: 'Anonymous Tiger',
    avatarColor: '#FF5733',
    coinBalance: 100,
    freeMinutes: 5,
    totalSpent: 0,
    milestones: [],
    phone: '+919876543210',
    onboardingCompleted: true,
    isOnline: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Add 1 test host
  const hostRef = db.collection('hosts').doc('test-host-001');
  batch.set(hostRef, {
    uid: 'test-host-001',
    alias: 'Asha Waves',
    avatarColor: '#FF6B6B',
    bio: 'Here to make you smile',
    ageGroup: '18-22',
    vibeTags: ['Funny', 'Hindi'],
    isStarHost: true,
    starRank: 1,
    starLanguage: 'Hindi',
    avgRating: 4.9,
    ratingCount: 124,
    ratePerAudioMinute: 5,
    ratePerVideoMinute: 10,
    languages: ['Hindi', 'English'],
    isOnline: true,
    callStatus: 'available',
    totalCalls: 154,
    totalEarnings: 5000,
    availableForWithdrawal: 3000,
    pendingWithdrawal: 0,
    totalCallMinutes: 1200,
    weeklyCallMinutes: 300,
    verificationStatus: 'verified',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await batch.commit();
  console.log('Seeded 1 user and 1 host into Firestore!');
  console.log('User ID: test-user-001');
  console.log('Host ID: test-host-001');
}

seed().catch(console.error);
