// REAL Firebase Configuration - BUKAN SIMULASI
const firebaseConfig = {
  apiKey: "AIzaSyA5b7KYCxC8WuYkvdYGIi1z6t84gGc-MxA",
  authDomain: "simple-bisnisbrengsekbgt.firebaseapp.com",
  databaseURL: "https://simple-bisnisbrengsekbgt-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "simple-bisnisbrengsekbgt",
  storageBucket: "simple-bisnisbrengsekbgt.firebasestorage.app",
  messagingSenderId: "261716836340",
  appId: "1:261716836340:web:b2591092aebc9d3e5983a1"
};

// Initialize Firebase REAL
try {
  // Cek jika Firebase belum diinisialisasi
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('🔥 Firebase initialized SUCCESS');
  }
  
  // REAL Firebase instances
  window.realAuth = firebase.auth();
  window.realDatabase = firebase.database();
  window.realFirestore = firebase.firestore();
  window.realStorage = firebase.storage();
  
  console.log('✅ REAL Firebase components loaded');
  
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  alert('Firebase connection error. Please refresh page.');
}
