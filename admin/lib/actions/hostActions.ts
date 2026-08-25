"use server"

import { getSupabaseAdmin } from '@/lib/supabaseServer'
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
    const supabase = getSupabaseAdmin()
    
    let phoneNumber = validated.phone
    if (!phoneNumber.startsWith('+91')) {
        phoneNumber = '+91' + phoneNumber.replace(/^0+/, '')
    }

    const uid = crypto.randomUUID()

    // 1. Create profiles record
    await supabase.from('profiles').upsert({
      id: uid,
      display_name: validated.alias,
      phone: phoneNumber,
      about: validated.bio,
      role: 'host',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    // 2. Create hosts record
    await supabase.from('hosts').upsert({
      id: uid,
      bio: validated.bio,
      rate_per_audio_minute: 5,
      rate_per_video_minute: 10,
      is_available: true,
      updated_at: new Date().toISOString(),
    })

    return { success: true, uid }
  } catch (error: any) {
    console.error("Error creating host:", error)
    return { success: false, error: error.message || 'Failed to create host' }
  }
}
