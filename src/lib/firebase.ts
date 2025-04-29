
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD_HyTyQqtXOeynDLS8g-qddnQ1tmk2nEI",
  authDomain: "note-bot-37724.firebaseapp.com",
  projectId: "note-bot-37724",
  storageBucket: "note-bot-37724.firebasestorage.app",
  messagingSenderId: "1025138595983",
  appId: "1:1025138595983:web:0fb912cf4880162d23b8fa",
  measurementId: "G-2D5486CV48"

  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


export { app, auth, db, storage };
