import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

function parseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      private_key: String(parsed.private_key || "").replace(/\\n/g, "\n"),
    };
  } catch (error) {
    console.warn(`Invalid FIREBASE_SERVICE_ACCOUNT_JSON: ${String(error)}`);
    return null;
  }
}

function getCredential() {
  const serviceAccount = parseServiceAccount();
  if (serviceAccount) {
    return cert(serviceAccount);
  }
  return applicationDefault();
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: getCredential(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export const adminMessaging = getMessaging(app);
