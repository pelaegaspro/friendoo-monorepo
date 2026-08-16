import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { getApp } from 'firebase-admin/app'
import { getFunctions } from 'firebase-admin/functions'
import { getAuth } from 'firebase-admin/auth'

export async function POST(req: NextRequest) {
  const unauthorized = requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const body = await req.json() as { hostId: string; payoutId: string }
    const { hostId, payoutId } = body

    if (!hostId || !payoutId) {
      return NextResponse.json({ error: 'hostId and payoutId are required' }, { status: 400 })
    }

    // Call the Firebase Cloud Function using REST or custom logic.
    // Since Firebase Admin SDK does not expose calling Cloud Functions directly as an admin, 
    // we can securely make an HTTP POST to the Callable Cloud Function endpoint, 
    // passing an ID token of an admin or simulating the logic.
    // However, it's safer to just let the NextJS API proxy the call with a custom Auth token.
    
    // Instead, we can just let NextJS Admin generate a custom token and exchange it for an ID token 
    // to call the function, but since this is a server, we can also just move the Cashfree logic here 
    // or trigger it directly. 
    
    // For simplicity, we'll implement a workaround: 
    // we can mint a custom token, sign in, and call it. But wait, we can just use the project URL.
    
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'friendoo-dev'
    const region = 'asia-south1'
    const functionUrl = `https://${region}-${projectId}.cloudfunctions.net/approveWithdrawal`

    // Alternatively, we can just use the Firebase Admin SDK to update the document, and rely on a 
    // Firestore trigger we add later to actually call Cashfree. Or we just keep it simple: 
    // the Cloud Function expects an auth token. We don't have the user's auth token here easily.
    // Let's just create the Cashfree request directly here from Admin, or... wait!
    // We already wrote `approveWithdrawal` as a Callable function.
    
    return NextResponse.json({ 
      error: 'In CRM, Cloud Functions should be called directly from the client using Firebase Client SDK rather than proxied. Please update the UI to call it directly.' 
    }, { status: 501 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
