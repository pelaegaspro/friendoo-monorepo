import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { getSupabaseAdmin, getOperationalAdminActorId } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}



export async function POST(req: NextRequest) {
  const unauthorized = await requireAdminApi()
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
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && Array.isArray(data)) {
      const logs = data.map((row) => {
        const r = asRecord(row)
        return {
          id: asString(r.id),
          title: asString(r.title),
          body: asString(r.body),
          target: asString(r.target_audience, 'all'),
          actionType: asString(r.action_type, 'none'),
          sentAt: asString(r.created_at),
          sentBy: 'admin',
        }
      })
      return NextResponse.json({ logs })
    }

    // Fallback to crm_campaigns if notifications table is not yet migrated
    const { data: crmData } = await supabase
      .from('crm_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    const crmRows = Array.isArray(crmData) ? crmData : []
    const logs = crmRows.map((row) => {
      const r = asRecord(row)
      const filter = asRecord(r.audience_filter)
      return {
        id: asString(r.id),
        title: asString(r.title || r.name),
        body: asString(r.body),
        target: asString(filter.target, 'all'),
        actionType: 'none',
        sentAt: asString(r.sent_at || r.created_at),
        sentBy: 'admin',
      }
    })

    return NextResponse.json({ logs })
  } catch (error) {
    const msg = error instanceof Error ? error.message : JSON.stringify(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
