import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  getDocFromServer,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, Sale, DailySaleRecord, MetaAdExpense, WhatsAppTemplate, PricingCalculationRecord, AISettings } from '../types';

// Initialize Firebase App & Services
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test initial connection to Firestore as mandated by the Firebase skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or connecting...');
      return false;
    }
    return true;
  }
}

// Full multi-device user state structure
export interface UserCloudState {
  userId: string;
  updatedAt: string;
  products?: Product[];
  sales?: Sale[];
  dailyRecords?: DailySaleRecord[];
  metaExpenses?: MetaAdExpense[];
  templates?: WhatsAppTemplate[];
  pricingRecords?: PricingCalculationRecord[];
  aiSettings?: AISettings;
}

// Save complete user state to Firestore (Isolated by Account/User ID)
export async function saveUserCloudState(userId: string, data: Partial<UserCloudState>): Promise<void> {
  if (!userId) return;
  const path = `workspaces/${userId}/userData/state`;
  try {
    const payload = {
      ...data,
      userId,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'workspaces', userId, 'userData', 'state'), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Load one-time user state from Firestore
export async function loadUserCloudState(userId: string): Promise<UserCloudState | null> {
  if (!userId) return null;
  const path = `workspaces/${userId}/userData/state`;
  try {
    const docSnap = await getDoc(doc(db, 'workspaces', userId, 'userData', 'state'));
    if (docSnap.exists()) {
      return docSnap.data() as UserCloudState;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Subscribe to real-time changes across all connected devices
export function subscribeToUserCloudState(
  userId: string,
  onUpdate: (state: UserCloudState) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `workspaces/${userId}/userData/state`;
  return onSnapshot(
    doc(db, 'workspaces', userId, 'userData', 'state'),
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserCloudState;
        onUpdate(data);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

// Save User Profile in Firestore
export async function saveUserProfile(userId: string, profile: { username?: string; email: string; displayName?: string }): Promise<void> {
  const path = `users/${userId}`;
  try {
    await setDoc(
      doc(db, 'users', userId),
      {
        userId,
        email: profile.email,
        username: profile.username || profile.email.split('@')[0],
        displayName: profile.displayName || profile.username || profile.email.split('@')[0],
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Helper to normalize username/email for Firebase Auth
export function formatLoginIdentifier(identifier: string): string {
  const trimmed = identifier.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  // If user entered a username like 'carlos', format it to standard domain
  return `${trimmed}@drayo.app`;
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
};
export type { User };
