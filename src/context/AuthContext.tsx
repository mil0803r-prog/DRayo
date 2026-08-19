import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  formatLoginIdentifier,
  saveUserProfile,
  testConnection,
  User,
} from '../lib/firebase';
import {
  registerCloudAccount,
  loginCloudAccount,
  getSavedSession,
  clearSession,
  AppUserSession,
} from '../lib/accountAuth';

export interface GenericAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  currentUser: GenericAuthUser | null;
  username: string;
  loading: boolean;
  isCloudReady: boolean;
  isGuestMode: boolean;
  loginWithPassword: (identifier: string, pass: string) => Promise<void>;
  registerWithPassword: (username: string, email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  enableGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<GenericAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCloudReady, setIsCloudReady] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);

  useEffect(() => {
    // 1. Check if there is an active session from local/cloud account
    const saved = getSavedSession();
    if (saved && saved.isLoggedIn) {
      setCurrentUser({
        uid: saved.accountId,
        email: saved.email,
        displayName: saved.displayName || saved.username,
      });
      setLoading(false);
    }

    // 2. Test initial Firestore connection
    testConnection().then((connected) => {
      setIsCloudReady(connected);
    });

    // 3. Listen to Firebase Auth state change (for Google Sign-In or native Firebase accounts)
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
        });
        setIsGuestMode(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithPassword = async (identifier: string, pass: string) => {
    try {
      // First attempt: Cloud Account Registry in Firestore
      const session = await loginCloudAccount(identifier, pass);
      setCurrentUser({
        uid: session.accountId,
        email: session.email,
        displayName: session.displayName || session.username,
      });
      setIsGuestMode(false);
    } catch (accountError: any) {
      // If user not found in account registry, try native Firebase Auth
      try {
        const emailToUse = formatLoginIdentifier(identifier);
        const userCredential = await signInWithEmailAndPassword(auth, emailToUse, pass);
        setCurrentUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || identifier,
        });
        setIsGuestMode(false);
      } catch (fbError: any) {
        // Return clear, user-friendly message
        throw new Error(accountError.message || 'Usuario o contraseña incorrectos');
      }
    }
  };

  const registerWithPassword = async (userDisplayName: string, rawEmail: string, pass: string) => {
    // Register in Cloud Account Registry in Firestore (always works without provider restrictions)
    const session = await registerCloudAccount(userDisplayName, rawEmail, pass);
    setCurrentUser({
      uid: session.accountId,
      email: session.email,
      displayName: session.displayName || session.username,
    });
    setIsGuestMode(false);

    // Also attempt background Firebase Auth creation if enabled
    try {
      const emailToUse = rawEmail.trim() ? rawEmail.trim().toLowerCase() : formatLoginIdentifier(userDisplayName);
      const cred = await createUserWithEmailAndPassword(auth, emailToUse, pass);
      if (cred.user) {
        await updateProfile(cred.user, { displayName: userDisplayName.trim() });
        await saveUserProfile(cred.user.uid, {
          username: userDisplayName.trim(),
          email: emailToUse,
          displayName: userDisplayName.trim(),
        });
      }
    } catch {
      // Silently continue with the Firestore Cloud Account
    }
  };

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await saveUserProfile(result.user.uid, {
        email: result.user.email || '',
        displayName: result.user.displayName || result.user.email?.split('@')[0] || '',
      });
      setCurrentUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Usuario Google',
      });
      setIsGuestMode(false);
    }
  };

  const logout = async () => {
    clearSession();
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setIsGuestMode(false);
  };

  const enableGuestMode = () => {
    setIsGuestMode(true);
  };

  const computedUsername =
    currentUser?.displayName ||
    (currentUser?.email ? currentUser.email.split('@')[0] : 'Usuario');

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        username: computedUsername,
        loading,
        isCloudReady,
        isGuestMode,
        loginWithPassword,
        registerWithPassword,
        loginWithGoogle,
        logout,
        enableGuestMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
