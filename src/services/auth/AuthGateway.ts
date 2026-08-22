import { auth } from '../firebase';
import {
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  updatePassword,
  signOut,
  onAuthStateChanged,
  User,
  AuthProvider,
  signInWithPopup,
} from 'firebase/auth';

export const authGateway = {
  signInWithEmailAndPassword: (email: string, password: string) => {
    if (!auth) throw new Error('API_KEY_UNAVAILABLE (Mock Mode Fallback)');
    return signInWithEmailAndPassword(auth, email, password);
  },
  createUserWithEmailAndPassword: (email: string, password: string) => {
    if (!auth) throw new Error('API_KEY_UNAVAILABLE (Mock Mode Fallback)');
    return createUserWithEmailAndPassword(auth, email, password);
  },
  updateProfile: (user: User, profile: any) => {
    if (!auth) throw new Error('API_KEY_UNAVAILABLE (Mock Mode Fallback)');
    return updateProfile(user, profile);
  },
  signInWithPopup: (provider: AuthProvider) => {
    if (!auth) throw new Error('API_KEY_UNAVAILABLE (Mock Mode Fallback)');
    throw new Error('Interactive provider login is disabled. Use the canonical email/password authentication flow.');
  },
  updatePassword: (user: User, password: string) => {
    if (!auth) throw new Error('API_KEY_UNAVAILABLE (Mock Mode Fallback)');
    return updatePassword(user, password);
  },
  signOut: () => {
    if (!auth) return Promise.resolve();
    return signOut(auth);
  },
  sendPasswordResetEmail: (email: string) => {
    if (!auth) throw new Error('API_KEY_UNAVAILABLE (Mock Mode Fallback)');
    return sendPasswordResetEmail(auth, email);
  },
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    if (!auth) {
      console.log('[AuthGateway] Mock mode active: no auth object available.');
      setTimeout(() => callback(null), 10);
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  },
  getCurrentUser: () => {
    if (!auth) return null;
    return auth.currentUser;
  },
};
