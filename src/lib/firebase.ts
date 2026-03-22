import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

console.log('🔥 Initializing Firebase with config:', firebaseConfig);

const app = initializeApp(firebaseConfig);
console.log('✅ Firebase app initialized');

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
console.log('✅ Firestore initialized with database:', firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
console.log('✅ Firebase Auth initialized');

export const storage = getStorage(app);
console.log('✅ Firebase Storage initialized');

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

export const loginWithGoogle = async () => {
  try {
    console.log('🔐 Attempting Google Sign-in with provider:', googleProvider);
    const result = await signInWithPopup(auth, googleProvider);
    console.log('✅ Authentication successful:', result.user.email);
    return result;
  } catch (error) {
    console.error('❌ Error logging in with Google:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    console.log('✅ Logged out successfully');
  } catch (error) {
    console.error('❌ Error logging out:', error);
    throw error;
  }
};
