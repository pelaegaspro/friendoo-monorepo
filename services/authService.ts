import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User,
} from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';

function getFirebase() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };

  const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  return { app, auth, db };
}

export const authService = {
  async signInWithPhone(phoneNumber: string, recaptchaContainerId: string): Promise<ConfirmationResult> {
    const { auth } = getFirebase();
    
    const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
      size: 'invisible',
    });

    return await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  },

  async verifyOTP(confirmationResult: ConfirmationResult, otp: string) {
    return await confirmationResult.confirm(otp);
  },

  async signInWithGoogle() {
    const { auth } = getFirebase();
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(auth, provider);
  },

  async signOut() {
    const { auth } = getFirebase();
    await signOut(auth);
  },

  getCurrentUser(): User | null {
    const { auth } = getFirebase();
    return auth.currentUser;
  },

  async isOnboardingComplete(uid: string): Promise<boolean> {
    const { db } = getFirebase();
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return !!snap.data().onboardingComplete;
    }
    return false;
  },

  subscribeToAuthState(callback: (user: User | null) => void) {
    const { auth } = getFirebase();
    return onAuthStateChanged(auth, callback);
  },
};
