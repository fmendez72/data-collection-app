// firebase-config.js
// Firebase SDK v9 (Modular) - Import from CDN

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// ============================================================
// FIREBASE CONFIGURATION
// ============================================================
// TODO: Replace the placeholder values below with your actual Firebase project credentials
// You can find these in your Firebase Console:
// 1. Go to Firebase Console (https://console.firebase.google.com/)
// 2. Select your project
// 3. Click on the gear icon (Project Settings)
// 4. Scroll down to "Your apps" section
// 5. Click on the Web app (</> icon)
// 6. Copy the config values and paste them below

const firebaseConfig = {
  apiKey: "AIzaSyBnBERORVLUOrmnfiT787k9OHM7EPW5Nlw",
  authDomain: "data-collector-2025.firebaseapp.com",
  projectId: "data-collector-2025",
  storageBucket: "data-collector-2025.firebasestorage.app",
  messagingSenderId: "214406301826",
  appId: "1:214406301826:web:395e8e7eb23f7a0c6a8c9b"
};

// ============================================================
// INITIALIZE FIREBASE
// ============================================================

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Firestore Database
const db = getFirestore(app);

// ============================================================
// EXPORTS
// ============================================================

export { app, auth, db };
