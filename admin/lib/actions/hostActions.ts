"use server"

import { getAuth, getDb, adminFieldValue } from '@/lib/firebaseAdmin'
import { z } from 'zod'

const hostSchema = z.object({
  alias: z.string().min(1, "Alias is required"),
  phone: z.string().min(10, "Valid phone number required"),
  avatarColor: z.string().min(4, "Color is required"),
  bio: z.string().min(1, "Bio is required"),
  city: z.string().min(1, "City is required"),
  languages: z.array(z.string()).min(1, "At least one language required"),
  ageGroup: z.enum(["Teen", "Young Adult", "Adult", "Experienced"]),
  vibeTags: z.array(z.string()).max(3, "Max 3 vibe tags"),
  category: z.string().min(1, "Category is required"),
  upiId: z.string().optional()
})

/**
 * Creates a new Female Host with the simplified Age Group and Vibe Tag model.
 */
export async function createHostAction(data: z.infer<typeof hostSchema>) {
  try {
    const validated = hostSchema.parse(data)
    
    const auth = getAuth()
    const db = getDb()
    
    let phoneNumber = validated.phone
    if (!phoneNumber.startsWith('+91')) {
        phoneNumber = '+91' + phoneNumber.replace(/^0+/, '')
    }

    // 1. Create Firebase Auth user
    const userRecord = await auth.createUser({
      phoneNumber: phoneNumber,
      displayName: validated.alias
    })

    const uid = userRecord.uid

    // 2. Create users/{uid} document
    await db.collection('users').doc(uid).set({
      uid,
      alias: validated.alias,
      avatarColor: validated.avatarColor,
      phoneNumber,
      bio: validated.bio,
      city: validated.city,
      languages: validated.languages,
      gender: "female", // Universal Female Host Model
      ageGroup: validated.ageGroup,
      isHost: true,
      onboardingComplete: true,
      createdAt: adminFieldValue.serverTimestamp()
    })

    // 3. Create hosts/{uid} document
    await db.collection('hosts').doc(uid).set({
      uid,
      alias: validated.alias,
      avatarColor: validated.avatarColor,
      bio: validated.bio,
      ageGroup: validated.ageGroup,
      vibeTags: validated.vibeTags,
      category: validated.category,
      gender: "female",
      ratePerAudioMinute: 5, // Standard starting rate
      isStarHost: false,
      avgRating: 5.0,
      ratingCount: 0,
      languages: validated.languages,
      isOnline: false,
      walletBalance: 0,
      totalEarned: 0,
      totalCalls: 0,
      upiId: validated.upiId || null,
      upiVerified: false,
      verified: true,
      createdAt: adminFieldValue.serverTimestamp()
    })

    return { success: true, uid }
  } catch (error: any) {
    console.error("Error creating host:", error)
    return { success: false, error: error.message || 'Failed to create host' }
  }
}
