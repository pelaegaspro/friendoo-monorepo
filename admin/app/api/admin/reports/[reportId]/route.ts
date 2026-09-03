import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params;
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const { action, reportedId } = await req.json() as { action: 'ban' | 'dismiss'; reportedId: string }
    const supabase = getSupabaseAdmin()
    const now = new Date().toISOString()

    if (action === 'ban' && reportedId) {
      await supabase.from('profiles').update({ is_banned: true, updated_at: now }).eq('id', reportedId)
      await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId)
    } else {
      await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
