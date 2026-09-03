import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { deleteHost, updateHost } from '@/lib/admin/data'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ hostId: string }> }
) {
  const { hostId } = await params;
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: 'suspend' | 'restore' | 'edit'
      updates?: Record<string, unknown>
    }

    if (!body.action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 })
    }

    await updateHost(hostId, {
      action: body.action,
      updates: body.updates as never,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ hostId: string }> }
) {
  const { hostId } = await params;
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    await deleteHost(hostId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
