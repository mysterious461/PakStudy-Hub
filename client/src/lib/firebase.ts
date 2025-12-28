import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "`GOOGLE_API_KEY`",
  authDomain: "pakstudy-hub-d418b.firebaseapp.com",
  projectId: "pakstudy-hub-d418b",
  storageBucket: "pakstudy-hub-d418b.firebasestorage.app",
  messagingSenderId: "41032167808",
  appId: "1:41032167808:web:85cc910bb800ffee8a1165",
  measurementId: "G-VKWJ8PN0HL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
