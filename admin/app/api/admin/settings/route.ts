import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { getAppSettings, saveAppSettings } from '@/lib/admin/data'

export async function GET() {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const settings = await getAppSettings()
    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const body = await request.json()
    await saveAppSettings(body)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
