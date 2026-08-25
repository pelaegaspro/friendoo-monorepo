import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { listTransactions } from '@/lib/admin/data'

export async function GET() {
  const unauthorized = requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const transactions = await listTransactions()
    return NextResponse.json({ transactions })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
