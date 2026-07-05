import { applicationDefault, cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

let serviceAccountParseError = false;
let firebaseAdminInitialized = false;
let firebaseAdminInitError = "";

function getServiceAccount(): ServiceAccount | undefined {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw) as ServiceAccount & { private_key?: string };
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    }
    return parsed;
  } catch {
    serviceAccountParseError = true;
    console.error("Firebase Admin service account JSON could not be parsed. Falling back to Application Default Credentials.");
    return undefined;
  }
}

const serviceAccount = getServiceAccount();
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

export const firebaseApp = getApps()[0] ?? (() => {
  try {
    const app = initializeApp({
      credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
      projectId,
      storageBucket,
    });
    firebaseAdminInitialized = true;
    return app;
  } catch (error: any) {
    firebaseAdminInitError = error?.message || "Firebase Admin initialization failed";
    console.error("Firebase Admin initialization failed:", firebaseAdminInitError);
    throw error;
  }
})();

firebaseAdminInitialized = true;

export const adminAuth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const bucket = storageBucket ? getStorage(firebaseApp).bucket(storageBucket) : getStorage(firebaseApp).bucket();
export { FieldValue, Timestamp };

export function getFirebaseAdminDiagnostics() {
  return {
    initialized: firebaseAdminInitialized,
    initError: firebaseAdminInitError ? "present" : "none",
    serviceAccountJsonPresent: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
    serviceAccountJsonParsed: Boolean(serviceAccount) || !process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    serviceAccountJsonParseError: serviceAccountParseError,
    projectIdPresent: Boolean(projectId),
    googleCloudProjectPresent: Boolean(process.env.GOOGLE_CLOUD_PROJECT),
    storageBucketPresent: Boolean(storageBucket),
  };
}

export function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  return new Date();
}
