import { applicationDefault, cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function getServiceAccount(): ServiceAccount | undefined {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return undefined;

  const parsed = JSON.parse(raw) as ServiceAccount & { private_key?: string };
  if (parsed.private_key) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }
  return parsed;
}

const serviceAccount = getServiceAccount();
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

export const firebaseApp = getApps()[0] ?? initializeApp({
  credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
  projectId,
  storageBucket,
});

export const adminAuth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const bucket = storageBucket ? getStorage(firebaseApp).bucket(storageBucket) : getStorage(firebaseApp).bucket();
export { FieldValue, Timestamp };

export function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  return new Date();
}
