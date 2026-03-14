import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAyAHdwxVJWL997_hcJiGYR2Sz7CkbOLS8",
  authDomain: "bordersync.firebaseapp.com",
  projectId: "bordersync",
  storageBucket: "bordersync.firebasestorage.app",
  messagingSenderId: "92489793892",
  appId: "1:92489793892:web:807441359e83f025e87a71",
  measurementId: "G-P28MK98FT6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
setPersistence(auth, inMemoryPersistence);
export const db = getFirestore(app);
