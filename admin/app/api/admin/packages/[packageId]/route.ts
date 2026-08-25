import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { deletePackage } from '@/lib/admin/data'

export async function DELETE(
  _request: Request,
  { params }: { params: { packageId: string } }
) {
  const unauthorized = requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    await deletePackage(params.packageId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
