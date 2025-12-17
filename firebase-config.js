// firebase-config.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, 
         signInWithEmailAndPassword, sendEmailVerification, 
         sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { getDatabase, ref, set, get, update, remove, onValue, push } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA5b7KYCxC8WuYkvdYGIi1z6t84gGc-MxA",
  authDomain: "simple-bisnisbrengsekbgt.firebaseapp.com",
  projectId: "simple-bisnisbrengsekbgt",
  storageBucket: "simple-bisnisbrengsekbgt.firebasestorage.app",
  messagingSenderId: "261716836340",
  appId: "1:261716836340:web:b2591092aebc9d3e5983a1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { 
  auth, 
  database, 
  storage, 
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  ref, 
  set, 
  get, 
  update, 
  remove, 
  onValue,
  push,
  storageRef,
  uploadBytes,
  getDownloadURL
};
