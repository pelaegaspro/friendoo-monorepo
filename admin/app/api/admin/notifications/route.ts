import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { getSupabaseAdmin, getOperationalAdminActorId } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const unauthorized = requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const { title, body, target, userId, actionType, actionUrl } = await req.json() as {
      title: string
      body: string
      target: 'all' | 'users' | 'hosts' | 'user'
      userId?: string
      actionType?: 'recharge' | 'open_lounge' | 'link' | 'none'
      actionUrl?: string
    }

    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'title and body are required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const actorId = getOperationalAdminActorId()

    // 1. Insert into public.notifications for live app sync
    const { error: notifError } = await supabase.from('notifications').insert({
      title: title.trim(),
      body: body.trim(),
      type: actionType === 'recharge' ? 'offer' : target === 'hosts' ? 'host_surge' : 'general',
      target_audience: target || 'all',
      user_id: target === 'user' && userId ? userId : null,
      action_type: actionType || 'none',
      action_url: actionUrl || null,
    })

    if (notifError) {
      console.warn('notifications insert fallback:', notifError)
    }

    // 2. Also record in crm_campaigns log
    await supabase.from('crm_campaigns').insert({
      name: title.trim(),
      title: title.trim(),
      body: body.trim(),
      channel: 'push',
      created_by: actorId,
      status: 'sent',
      sent_at: new Date().toISOString(),
      audience_filter: { target, userId },
      delivery_summary: { success_count: 1, recipient: target === 'user' ? userId : target },
    })

    return NextResponse.json({ success: true, successCount: 1 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function GET() {
  const unauthorized = requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    const logs = (data ?? []).map((d: any) => ({
      id: d.id,
      title: d.title || '',
      body: d.body || '',
      target: d.target_audience || 'all',
      actionType: d.action_type || 'none',
      sentAt: d.created_at,
      sentBy: 'admin',
    }))

    return NextResponse.json({ logs })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
