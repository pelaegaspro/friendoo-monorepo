import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { uploadHostPhoto } from '@/lib/admin/data'

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const uidField = formData.get('uid')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }

    const uid = typeof uidField === 'string' && uidField.trim() ? uidField.trim() : undefined

    const bytes = Buffer.from(await file.arrayBuffer())
    const photoURL = await uploadHostPhoto(
      file.name,
      bytes,
      file.type || 'application/octet-stream',
      uid
    )
    return NextResponse.json({ photoURL })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
