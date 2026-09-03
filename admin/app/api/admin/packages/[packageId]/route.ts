import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { deletePackage } from '@/lib/admin/data'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ packageId: string }> }
) {
  const { packageId } = await params;
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    await deletePackage(packageId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
