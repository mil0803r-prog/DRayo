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
  initializeFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  onSnapshot,
  getDocFromServer,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, Sale, DailySaleRecord, MetaAdExpense, WhatsAppTemplate, PricingCalculationRecord, IndirectCost, AISettings } from '../types';

// Initialize Firebase App & Services with robust networking configuration
export const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);
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

// Test initial connection to Firestore with graceful offline handling
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (
      error?.code === 'unavailable' ||
      error?.message?.includes('the client is offline') ||
      error?.message?.includes('Could not reach Cloud Firestore backend')
    ) {
      console.info('Firestore client is active in offline/local cache mode.');
      return true;
    }
    return false;
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
  indirectCosts?: IndirectCost[];
  templates?: WhatsAppTemplate[];
  pricingRecords?: PricingCalculationRecord[];
  aiSettings?: AISettings;
}

// Helper to sanitize objects and arrays recursively for Firestore (removes all undefined fields)
function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined || data === null) return data;
  return JSON.parse(JSON.stringify(data));
}

// Cache to prevent duplicate Firestore writes if data hasn't changed
const lastWrittenHash = new Map<string, string>();
const pendingWrites = new Map<string, Partial<UserCloudState>>();
const pendingDebounceTimers = new Map<string, any>();

/**
 * Flush pending writes to Firestore safely and avoid write stream exhaustion
 */
async function flushPendingWrites(userId: string): Promise<void> {
  const data = pendingWrites.get(userId);
  if (!data || !userId) return;
  pendingWrites.delete(userId);

  const basePath = `workspaces/${userId}/userData`;
  const now = new Date().toISOString();

  try {
    const writePromises: Promise<void>[] = [];

    // 1. Products
    if (data.products !== undefined) {
      const sanitized = sanitizeForFirestore(data.products);
      const hash = JSON.stringify(sanitized);
      const cacheKey = `${userId}:products`;
      if (lastWrittenHash.get(cacheKey) !== hash) {
        lastWrittenHash.set(cacheKey, hash);
        writePromises.push(
          setDoc(
            doc(db, 'workspaces', userId, 'userData', 'products'),
            { items: sanitized, updatedAt: now, userId }
          )
        );
      }
    }

    // 2. Sales
    if (data.sales !== undefined) {
      const sanitized = sanitizeForFirestore(data.sales);
      const hash = JSON.stringify(sanitized);
      const cacheKey = `${userId}:sales`;
      if (lastWrittenHash.get(cacheKey) !== hash) {
        lastWrittenHash.set(cacheKey, hash);
        writePromises.push(
          setDoc(
            doc(db, 'workspaces', userId, 'userData', 'sales'),
            { items: sanitized, updatedAt: now, userId }
          )
        );
      }
    }

    // 3. Daily WhatsApp Sales Records
    if (data.dailyRecords !== undefined) {
      const sanitized = sanitizeForFirestore(data.dailyRecords);
      const hash = JSON.stringify(sanitized);
      const cacheKey = `${userId}:dailyRecords`;
      if (lastWrittenHash.get(cacheKey) !== hash) {
        lastWrittenHash.set(cacheKey, hash);
        writePromises.push(
          setDoc(
            doc(db, 'workspaces', userId, 'userData', 'dailyRecords'),
            { items: sanitized, updatedAt: now, userId }
          )
        );
      }
    }

    // 4. Meta Ads Expenses
    if (data.metaExpenses !== undefined) {
      const sanitized = sanitizeForFirestore(data.metaExpenses);
      const hash = JSON.stringify(sanitized);
      const cacheKey = `${userId}:metaExpenses`;
      if (lastWrittenHash.get(cacheKey) !== hash) {
        lastWrittenHash.set(cacheKey, hash);
        writePromises.push(
          setDoc(
            doc(db, 'workspaces', userId, 'userData', 'metaExpenses'),
            { items: sanitized, updatedAt: now, userId }
          )
        );
      }
    }

    // 5. Pricing Calculator Records
    if (data.pricingRecords !== undefined) {
      const sanitized = sanitizeForFirestore(data.pricingRecords);
      const hash = JSON.stringify(sanitized);
      const cacheKey = `${userId}:pricingRecords`;
      if (lastWrittenHash.get(cacheKey) !== hash) {
        lastWrittenHash.set(cacheKey, hash);
        writePromises.push(
          setDoc(
            doc(db, 'workspaces', userId, 'userData', 'pricingRecords'),
            { items: sanitized, updatedAt: now, userId }
          )
        );
      }
    }

    // 6. Indirect Costs
    if (data.indirectCosts !== undefined) {
      const sanitized = sanitizeForFirestore(data.indirectCosts);
      const hash = JSON.stringify(sanitized);
      const cacheKey = `${userId}:indirectCosts`;
      if (lastWrittenHash.get(cacheKey) !== hash) {
        lastWrittenHash.set(cacheKey, hash);
        writePromises.push(
          setDoc(
            doc(db, 'workspaces', userId, 'userData', 'indirectCosts'),
            { items: sanitized, updatedAt: now, userId }
          )
        );
      }
    }

    // 7. WhatsApp Quick-Reply Templates
    if (data.templates !== undefined) {
      const sanitized = sanitizeForFirestore(data.templates);
      const hash = JSON.stringify(sanitized);
      const cacheKey = `${userId}:templates`;
      if (lastWrittenHash.get(cacheKey) !== hash) {
        lastWrittenHash.set(cacheKey, hash);
        writePromises.push(
          setDoc(
            doc(db, 'workspaces', userId, 'userData', 'templates'),
            { items: sanitized, updatedAt: now, userId }
          )
        );
      }
    }

    // 8. AI Settings
    if (data.aiSettings !== undefined) {
      const sanitized = sanitizeForFirestore(data.aiSettings);
      const hash = JSON.stringify(sanitized);
      const cacheKey = `${userId}:aiSettings`;
      if (lastWrittenHash.get(cacheKey) !== hash) {
        lastWrittenHash.set(cacheKey, hash);
        writePromises.push(
          setDoc(
            doc(db, 'workspaces', userId, 'userData', 'aiSettings'),
            { settings: sanitized, updatedAt: now, userId }
          )
        );
      }
    }

    if (writePromises.length > 0) {
      await Promise.all(writePromises);
    }
  } catch (error: any) {
    if (error?.code === 'resource-exhausted' || error?.message?.includes('resource-exhausted')) {
      console.warn('Firestore write stream throttled. Data will retry on next edit.');
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, basePath);
  }
}

/**
 * Save user state to Firestore using modular sub-documents under /userData/
 * with intelligent debouncing and diff-checking to avoid write stream limits.
 */
export async function saveUserCloudState(userId: string, data: Partial<UserCloudState>): Promise<void> {
  if (!userId) return;

  // Merge into pending buffer
  const currentPending = pendingWrites.get(userId) || {};
  pendingWrites.set(userId, { ...currentPending, ...data });

  // Debounce writes by 300ms to coalesce rapid user interactions
  if (pendingDebounceTimers.has(userId)) {
    clearTimeout(pendingDebounceTimers.get(userId));
  }

  return new Promise((resolve) => {
    const timer = setTimeout(async () => {
      pendingDebounceTimers.delete(userId);
      await flushPendingWrites(userId);
      resolve();
    }, 300);
    pendingDebounceTimers.set(userId, timer);
  });
}

/**
 * Load user state from Firestore, reading modular sub-documents with fallback to legacy monolithic state.
 */
export async function loadUserCloudState(userId: string): Promise<UserCloudState | null> {
  if (!userId) return null;
  const path = `workspaces/${userId}/userData`;

  try {
    const collectionSnap = await getDocs(collection(db, 'workspaces', userId, 'userData'));
    if (collectionSnap.empty) {
      return null;
    }

    const state: UserCloudState = {
      userId,
      updatedAt: new Date().toISOString(),
    };

    let foundAnyData = false;

    collectionSnap.forEach((docSnap) => {
      const docId = docSnap.id;
      const data = docSnap.data();

      if (docId === 'products' && Array.isArray(data.items || data.products)) {
        state.products = (data.items || data.products) as Product[];
        foundAnyData = true;
      } else if (docId === 'sales' && Array.isArray(data.items || data.sales)) {
        state.sales = (data.items || data.sales) as Sale[];
        foundAnyData = true;
      } else if (docId === 'dailyRecords' && Array.isArray(data.items || data.dailyRecords)) {
        state.dailyRecords = (data.items || data.dailyRecords) as DailySaleRecord[];
        foundAnyData = true;
      } else if (docId === 'metaExpenses' && Array.isArray(data.items || data.metaExpenses)) {
        state.metaExpenses = (data.items || data.metaExpenses) as MetaAdExpense[];
        foundAnyData = true;
      } else if (docId === 'pricingRecords' && Array.isArray(data.items || data.pricingRecords)) {
        state.pricingRecords = (data.items || data.pricingRecords) as PricingCalculationRecord[];
        foundAnyData = true;
      } else if (docId === 'indirectCosts' && Array.isArray(data.items || data.indirectCosts)) {
        state.indirectCosts = (data.items || data.indirectCosts) as IndirectCost[];
        foundAnyData = true;
      } else if (docId === 'templates' && Array.isArray(data.items || data.templates)) {
        state.templates = (data.items || data.templates) as WhatsAppTemplate[];
        foundAnyData = true;
      } else if (docId === 'aiSettings' && (data.settings || data.aiSettings)) {
        state.aiSettings = (data.settings || data.aiSettings) as AISettings;
        foundAnyData = true;
      } else if (docId === 'state' && !data.isModular) {
        // Legacy monolithic document fallback
        if (state.products === undefined && data.products) state.products = data.products;
        if (state.sales === undefined && data.sales) state.sales = data.sales;
        if (state.dailyRecords === undefined && data.dailyRecords) state.dailyRecords = data.dailyRecords;
        if (state.metaExpenses === undefined && data.metaExpenses) state.metaExpenses = data.metaExpenses;
        if (state.pricingRecords === undefined && data.pricingRecords) state.pricingRecords = data.pricingRecords;
        if (state.indirectCosts === undefined && data.indirectCosts) state.indirectCosts = data.indirectCosts;
        if (state.templates === undefined && data.templates) state.templates = data.templates;
        if (state.aiSettings === undefined && data.aiSettings) state.aiSettings = data.aiSettings;
        foundAnyData = true;
      }
    });

    return foundAnyData ? state : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Subscribe to real-time changes across all connected devices using the modular collection listener.
 */
export function subscribeToUserCloudState(
  userId: string,
  onUpdate: (state: UserCloudState) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `workspaces/${userId}/userData`;

  return onSnapshot(
    collection(db, 'workspaces', userId, 'userData'),
    (snapshot) => {
      if (snapshot.empty) return;

      const state: UserCloudState = {
        userId,
        updatedAt: new Date().toISOString(),
      };

      let foundAnyData = false;

      snapshot.forEach((docSnap) => {
        const docId = docSnap.id;
        const data = docSnap.data();

        if (docId === 'products' && Array.isArray(data.items || data.products)) {
          state.products = (data.items || data.products) as Product[];
          foundAnyData = true;
        } else if (docId === 'sales' && Array.isArray(data.items || data.sales)) {
          state.sales = (data.items || data.sales) as Sale[];
          foundAnyData = true;
        } else if (docId === 'dailyRecords' && Array.isArray(data.items || data.dailyRecords)) {
          state.dailyRecords = (data.items || data.dailyRecords) as DailySaleRecord[];
          foundAnyData = true;
        } else if (docId === 'metaExpenses' && Array.isArray(data.items || data.metaExpenses)) {
          state.metaExpenses = (data.items || data.metaExpenses) as MetaAdExpense[];
          foundAnyData = true;
        } else if (docId === 'pricingRecords' && Array.isArray(data.items || data.pricingRecords)) {
          state.pricingRecords = (data.items || data.pricingRecords) as PricingCalculationRecord[];
          foundAnyData = true;
        } else if (docId === 'indirectCosts' && Array.isArray(data.items || data.indirectCosts)) {
          state.indirectCosts = (data.items || data.indirectCosts) as IndirectCost[];
          foundAnyData = true;
        } else if (docId === 'templates' && Array.isArray(data.items || data.templates)) {
          state.templates = (data.items || data.templates) as WhatsAppTemplate[];
          foundAnyData = true;
        } else if (docId === 'aiSettings' && (data.settings || data.aiSettings)) {
          state.aiSettings = (data.settings || data.aiSettings) as AISettings;
          foundAnyData = true;
        } else if (docId === 'state' && !data.isModular) {
          // Legacy fallback
          if (state.products === undefined && data.products) state.products = data.products;
          if (state.sales === undefined && data.sales) state.sales = data.sales;
          if (state.dailyRecords === undefined && data.dailyRecords) state.dailyRecords = data.dailyRecords;
          if (state.metaExpenses === undefined && data.metaExpenses) state.metaExpenses = data.metaExpenses;
          if (state.pricingRecords === undefined && data.pricingRecords) state.pricingRecords = data.pricingRecords;
          if (state.indirectCosts === undefined && data.indirectCosts) state.indirectCosts = data.indirectCosts;
          if (state.templates === undefined && data.templates) state.templates = data.templates;
          if (state.aiSettings === undefined && data.aiSettings) state.aiSettings = data.aiSettings;
          foundAnyData = true;
        }
      });

      if (foundAnyData) {
        onUpdate(state);
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
      sanitizeForFirestore({
        userId,
        email: profile.email,
        username: profile.username || profile.email.split('@')[0],
        displayName: profile.displayName || profile.username || profile.email.split('@')[0],
        updatedAt: new Date().toISOString(),
      }),
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

