import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAAc2nT0h7lS1vloGWC0YPYdJUxGD9Xuk8",
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
