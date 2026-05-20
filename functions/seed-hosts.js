const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'friendoo-v1'
});

const db = admin.firestore();

const hosts = [
  {
    uid: "host1",
    alias: "Asha Waves",
    avatarColor: "#FF6B6B",
    bio: "Here to make you smile 😊",
    ageGroup: "18-22",
    vibeTags: ["Funny", "Hindi"],
    isStarHost: true,
    starRank: 1,
    starLanguage: "Hindi",
    avgRating: 4.9,
    ratingCount: 124,
    ratePerAudioMinute: 5,
    languages: ["Hindi", "English"],
    isOnline: true,
    callStatus: "available",
    totalCalls: 154
  },
  {
    uid: "host2",
    alias: "Kabir Calm",
    avatarColor: "#4ECDC4",
    bio: "Deep talks, no judgment",
    ageGroup: "23-27",
    vibeTags: ["Chill", "English"],
    isStarHost: false,
    starRank: null,
    starLanguage: null,
    avgRating: 4.8,
    ratingCount: 89,
    ratePerAudioMinute: 7,
    languages: ["English", "Hindi"],
    isOnline: true,
    callStatus: "busy",
    totalCalls: 210
  },
  {
    uid: "host3",
    alias: "Meera Sun",
    avatarColor: "#FFE66D",
    bio: "Your calm in the chaos",
    ageGroup: "23-27",
    vibeTags: ["Advice", "Tamil"],
    isStarHost: true,
    starRank: 2,
    starLanguage: "Tamil",
    avgRating: 4.9,
    ratingCount: 312,
    ratePerAudioMinute: 6,
    languages: ["Tamil", "English"],
    isOnline: true,
    callStatus: "available",
    totalCalls: 502
  },
  {
    uid: "host4",
    alias: "Zoya Night",
    avatarColor: "#A78BFA",
    bio: "Night conversations are the best",
    ageGroup: "28+",
    vibeTags: ["Deep", "Urdu"],
    isStarHost: false,
    starRank: null,
    starLanguage: null,
    avgRating: 4.7,
    ratingCount: 45,
    ratePerAudioMinute: 8,
    languages: ["Urdu", "Hindi"],
    isOnline: false,
    callStatus: "offline",
    totalCalls: 78
  },
  {
    uid: "host5",
    alias: "Nila Talks",
    avatarColor: "#60A5FA",
    bio: "Always here to listen",
    ageGroup: "18-22",
    vibeTags: ["Calm", "Telugu"],
    isStarHost: false,
    starRank: null,
    starLanguage: null,
    avgRating: 4.8,
    ratingCount: 156,
    ratePerAudioMinute: 5,
    languages: ["Telugu", "English"],
    isOnline: true,
    callStatus: "available",
    totalCalls: 231
  }
];

async function seed() {
  const batch = db.batch();
  hosts.forEach(host => {
    const ref = db.collection('hosts').doc(host.uid);
    batch.set(ref, host);
  });
  
  await batch.commit();
  console.log("Seeded mock hosts data into firestore!");
}

seed().catch(console.error);
