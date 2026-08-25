import admin from 'firebase-admin'

let initialized = false

function getStorageBucketName() {
  return (
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    undefined
  )
}

function getServiceAccount(): admin.ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!raw || raw === '{}') return null

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const privateKeyRaw =
      (typeof parsed.privateKey === 'string' ? parsed.privateKey : undefined) ||
      (typeof parsed.private_key === 'string' ? parsed.private_key : undefined)
    const clientEmail =
      (typeof parsed.clientEmail === 'string' ? parsed.clientEmail : undefined) ||
      (typeof parsed.client_email === 'string' ? parsed.client_email : undefined)
    const projectId =
      (typeof parsed.projectId === 'string' ? parsed.projectId : undefined) ||
      (typeof parsed.project_id === 'string' ? parsed.project_id : undefined)

    if (!privateKeyRaw || !clientEmail) {
      return null
    }

    return {
      projectId,
      clientEmail,
      privateKey: privateKeyRaw.replace(/\\n/g, '\n'),
    }
  } catch (error) {
    console.warn(`Invalid FIREBASE_SERVICE_ACCOUNT_JSON: ${String(error)}`)
    return null
  }
}

export function getAdminApp() {
  if (!initialized) {
    const existing = admin.apps[0]
    if (existing) {
      initialized = true
      return existing
    }

    const serviceAccount = getServiceAccount()
    const storageBucket = getStorageBucketName()

    admin.initializeApp({
      credential: serviceAccount ? admin.credential.cert(serviceAccount) : admin.credential.applicationDefault(),
      storageBucket,
    })

    initialized = true
  }

  return admin.app()
}

export function getDb() {
  return getAdminApp().firestore()
}

export function getAuth() {
  return getAdminApp().auth()
}

export function getBucket() {
  return getAdminApp().storage().bucket()
}

export const adminFieldValue = admin.firestore.FieldValue
export { admin }
