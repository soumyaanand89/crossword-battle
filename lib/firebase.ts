// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyAHq09OxjiKjDXd9qFZgB2zXneGYGtK3UY",
  authDomain: "crossword-battle-eb4cc.firebaseapp.com",
  projectId: "crossword-battle-eb4cc",
  storageBucket: "crossword-battle-eb4cc.firebasestorage.app",
  messagingSenderId: "614509587838",
  appId: "1:614509587838:web:9dd5633d10083028fd572f"
};


// Ensure we don’t initialize twice during development
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);


export const db = getFirestore(app);