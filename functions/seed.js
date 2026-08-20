const admin = require('firebase-admin');

// IMPORTANT: Before running this script, ensure you are either authenticated via gcloud CLI 
// (e.g., `gcloud auth application-default login`) or you have set the 
// GOOGLE_APPLICATION_CREDENTIALS environment variable pointing to your service account key.
// Example: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/serviceAccountKey.json"

admin.initializeApp();
const db = admin.firestore();

async function seed() {
    console.log("Seeding Firebase Firestore with sample data...");
    
    // Seed Hosts
    console.log("Adding Hosts...");
    const hostsRef = db.collection('hosts');
    await hostsRef.doc('host_1').set({
        alias: 'Priya',
        status: 'online',
        busyStatus: false,
        onVacation: false,
        ratePerMin: 5,
        totalCalls: 120,
        performanceScore: 4.8,
        starHost: true,
        languages: ['English', 'Hindi'],
        totalEarnings: 15000,
        walletBalance: 2500,
        pendingPayout: 500,
        totalMinutes: 3000,
        weeklyMinutes: 150,
        colorHex: '#FF5733',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await hostsRef.doc('host_2').set({
        alias: 'Aisha',
        status: 'online',
        busyStatus: false,
        onVacation: false,
        ratePerMin: 10,
        totalCalls: 45,
        performanceScore: 4.5,
        starHost: false,
        languages: ['English'],
        totalEarnings: 8000,
        walletBalance: 1200,
        pendingPayout: 0,
        totalMinutes: 800,
        weeklyMinutes: 40,
        colorHex: '#33C4FF',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Seed Users
    console.log("Adding Users...");
    const usersRef = db.collection('users');
    await usersRef.doc('user_1').set({
        displayName: 'Rahul',
        walletCoins: 150,
        freeCallMinutes: 5,
        totalCalls: 12,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Seed Coin Packs
    console.log("Adding Coin Packs...");
    const packsRef = db.collection('coin_packs');
    await packsRef.doc('pack_1').set({
        displayName: 'Starter Pack',
        price: 99,
        coinsAwarded: 100,
        bonus: 10,
        active: true
    });
    
    await packsRef.doc('pack_2').set({
        displayName: 'Pro Pack',
        price: 499,
        coinsAwarded: 550,
        bonus: 50,
        active: true
    });

    // Seed Reports & Messages
    console.log("Adding Reports...");
    const reportsRef = db.collection('reports');
    const reportDoc = await reportsRef.add({
        reportedId: 'host_2',
        reportedAlias: 'Aisha',
        reporterId: 'user_1',
        reason: 'Inappropriate behavior',
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const reportMessagesRef = reportsRef.doc(reportDoc.id).collection('messages');
    await reportMessagesRef.add({
        senderId: 'user_1',
        content: 'The host was rude to me.',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        isAdmin: false
    });

    // Seed Calls History
    console.log("Adding Call History...");
    const callsRef = db.collection('calls');
    await callsRef.doc('call_1').set({
        userId: 'user_1',
        hostId: 'host_1',
        status: 'ended',
        ratePerMin: 5,
        actualDuration: 300, // 5 minutes
        coinsUsed: 25,
        hostEarnings: 10,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        connectTime: admin.firestore.FieldValue.serverTimestamp(),
        endTime: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ Seeding complete!");
}

seed().catch(err => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
