const firebaseConfig = {
  apiKey: "AIzaSyDOO-5NXwFxd4vaxuohA2ctPE2I1Oo2HfE",
  authDomain: "chemec-scientific.firebaseapp.com",
  projectId: "chemec-scientific",
  storageBucket: "chemec-scientific.firebasestorage.app",
  messagingSenderId: "341071435473",
  appId: "1:341071435473:web:b046cd28cd9014388f17f0"
};

let app;
if (!window.db) {
  try {
    app = firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore();
    console.log("✅ Firebase initialized successfully");
    window.firebaseApp = app;
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error);
    // Fallback for offline mode
    window.db = null;
  }
}