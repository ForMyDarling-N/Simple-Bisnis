// REAL Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForDemoPurposesOnly",
  authDomain: "simple-bisnis-real.firebaseapp.com",
  databaseURL: "https://simple-bisnis-real-default-rtdb.firebaseio.com",
  projectId: "simple-bisnis-real",
  storageBucket: "simple-bisnis-real.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Initialize Firebase
try {
  // Check if Firebase is already initialized
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('🔥 Firebase REAL initialized');
  }
  
  // Global Firebase instances
  window.realAuth = firebase.auth();
  window.realDatabase = firebase.database();
  window.realFirestore = firebase.firestore();
  window.realStorage = firebase.storage();
  
  console.log('✅ REAL Firebase components ready');
  
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  
  // Fallback to mock Firebase for development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.warn('⚠️ Using Firebase mock for local development');
    
    window.realAuth = {
      onAuthStateChanged: (callback) => {
        // Mock user for local development
        setTimeout(() => callback({
          uid: 'local-user-123',
          email: 'demo@simplebisnis.com',
          emailVerified: true
        }), 1000);
        return () => {};
      },
      signInWithEmailAndPassword: () => Promise.resolve({ user: { uid: 'local-user-123' } }),
      createUserWithEmailAndPassword: () => Promise.resolve({ user: { uid: 'local-user-123' } }),
      signOut: () => Promise.resolve(),
      sendPasswordResetEmail: () => Promise.resolve(),
      currentUser: { uid: 'local-user-123' }
    };
    
    window.realDatabase = {
      ref: (path) => ({
        set: () => Promise.resolve(),
        update: () => Promise.resolve(),
        once: () => Promise.resolve({ val: () => ({}) }),
        on: () => {},
        off: () => {},
        child: function(childPath) {
          return {
            set: () => Promise.resolve(),
            update: () => Promise.resolve()
          };
        }
      })
    };
    
    window.realStorage = {
      ref: () => ({
        child: () => ({
          putString: () => Promise.resolve({
            ref: {
              getDownloadURL: () => Promise.resolve('https://example.com/image.jpg')
            }
          })
        })
      })
    };
    
    console.log('✅ Firebase mock initialized for local development');
  }
}
