"use server"

import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabaseServer'
import { ADMIN_COOKIE_NAME, isValidAdminSession } from '@/lib/admin/session'
import { z } from 'zod'

const hostSchema = z.object({
  alias: z.string().min(1, "Alias is required"),
  phone: z.string().min(10, "Valid phone number required"),
  avatarColor: z.string().min(4, "Color is required"),
  bio: z.string().min(1, "Bio is required"),
  city: z.string().min(1, "City is required"),
    languages: z.array(z.string()).min(1, "At least one language required"),
  expertiseTags: z.array(z.string()).min(1, "At least one expertise tag is required"),
  ratePerMinute: z.number().positive("Rate must be greater than zero"),
  gender: z.string().min(1, "Gender is required"),
  age: z.number().int().min(18, "Host must be at least 18 years old")

})

/**
 * Creates a new Female Host with the simplified Age Group and Vibe Tag model.
 */
export async function createHostAction(data: z.infer<typeof hostSchema>) {
    try {
    const cookieStore = await cookies()
    if (!isValidAdminSession(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
      return { success: false, error: 'Unauthorized' }
    }

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
            rate_per_audio_minute: validated.ratePerMinute,

      rate_per_video_minute: 10,
      is_available: true,
      updated_at: new Date().toISOString(),
    })

    return { success: true, uid }
    } catch (error) {
    console.error("Error creating host:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create host',
    }

  }
}
