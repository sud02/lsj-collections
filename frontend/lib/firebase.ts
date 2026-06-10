import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export const getFirebaseAuth = (): Auth => {
  if (typeof window === "undefined") {
    throw new Error("Firebase Auth is only available on the client");
  }
  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  }
  if (!auth) {
    auth = getAuth(app);
  }
  return auth;
};

let recaptchaVerifier: RecaptchaVerifier | null = null;

export const getRecaptchaVerifier = (containerId: string): RecaptchaVerifier => {
  const authInstance = getFirebaseAuth();
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(authInstance, containerId, {
      size: "invisible",
    });
  }
  return recaptchaVerifier;
};

export const resetRecaptcha = (): void => {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {
      // no-op
    }
    recaptchaVerifier = null;
  }
};

export const sendOTP = async (
  phoneE164: string,
  containerId: string
): Promise<ConfirmationResult> => {
  const authInstance = getFirebaseAuth();
  const verifier = getRecaptchaVerifier(containerId);
  return signInWithPhoneNumber(authInstance, phoneE164, verifier);
};
