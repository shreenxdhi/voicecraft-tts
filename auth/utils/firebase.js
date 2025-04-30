import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  FacebookAuthProvider,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Auth providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const appleProvider = new OAuthProvider('apple.com');
const microsoftProvider = new OAuthProvider('microsoft.com');
const facebookProvider = new FacebookAuthProvider();

// Email & password auth functions
export const loginWithEmailAndPassword = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const registerWithEmailAndPassword = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const resetPassword = (email) => {
  return sendPasswordResetEmail(auth, email);
};

// Social auth functions
export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

export const signInWithGithub = () => {
  return signInWithPopup(auth, githubProvider);
};

export const signInWithApple = () => {
  return signInWithPopup(auth, appleProvider);
};

export const signInWithMicrosoft = () => {
  return signInWithPopup(auth, microsoftProvider);
};

export const signInWithFacebook = () => {
  return signInWithPopup(auth, facebookProvider);
};

// Sign out
export const logOut = () => {
  return signOut(auth);
};

export { auth, db };
export default app; 