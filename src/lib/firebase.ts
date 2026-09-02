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
  deleteDoc,
  collection,
  onSnapshot,
  getDocFromServer,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, Sale, DailySaleRecord, MetaAdExpense, WhatsAppTemplate, PricingCalculationRecord, IndirectCost, AISettings } from '../types';
import { optimizeRecordsWithImages } from './imageUtils';

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
 * Save an array collection to Firestore with automatic chunking if payload approaches 1MB limit
 */
async function saveCollectionSafely<T extends Record<string, any>>(
  userId: string,
  collectionName: string,
  rawItems: T[],
  now: string
): Promise<void> {
  if (!userId || !Array.isArray(rawItems)) return;

  // 1. Optimize images if needed
  const items = (collectionName === 'dailyRecords' || collectionName === 'products')
    ? await optimizeRecordsWithImages(rawItems as any)
    : rawItems;
  const sanitized = sanitizeForFirestore(items) as T[];

  const serialized = JSON.stringify(sanitized);
  const approxSizeBytes = serialized.length * 2; // rough UTF-16 byte estimate
  const cacheKey = `${userId}:${collectionName}`;

  if (lastWrittenHash.get(cacheKey) === serialized) {
    return; // No changes
  }
  lastWrittenHash.set(cacheKey, serialized);

  // Firestore hard document limit is 1,048,576 bytes.
  // We chunk safely if serialized length exceeds 350KB or items.length > 50 with images
  const maxChunkBytes = 300000;
  const isLarge = approxSizeBytes > maxChunkBytes || (items.length > 40 && serialized.includes('data:image/'));

  if (!isLarge) {
    // Write as single lightweight document
    await setDoc(
      doc(db, 'workspaces', userId, 'userData', collectionName),
      { items: sanitized, isChunked: false, totalCount: sanitized.length, updatedAt: now, userId }
    );
  } else {
    // Split into smaller safe chunks (e.g. 20-30 items per chunk)
    const chunkSize = Math.max(10, Math.min(30, Math.floor(items.length / Math.ceil(approxSizeBytes / maxChunkBytes))));
    const chunks: T[][] = [];
    for (let i = 0; i < sanitized.length; i += chunkSize) {
      chunks.push(sanitized.slice(i, i + chunkSize));
    }

    const chunkWrites = chunks.map((chunk, index) =>
      setDoc(
        doc(db, 'workspaces', userId, 'userData', `${collectionName}_chunk_${index}`),
        { items: chunk, chunkIndex: index, isChunk: true, collectionKey: collectionName, updatedAt: now, userId }
      )
    );

    // Save main metadata pointer
    chunkWrites.push(
      setDoc(
        doc(db, 'workspaces', userId, 'userData', collectionName),
        { isChunked: true, chunksCount: chunks.length, totalCount: sanitized.length, updatedAt: now, userId }
      )
    );

    await Promise.all(chunkWrites);
  }
}

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

    // 1. Products (with auto-chunking & image compression)
    if (data.products !== undefined) {
      writePromises.push(saveCollectionSafely(userId, 'products', data.products, now));
    }

    // 2. Sales (with auto-chunking)
    if (data.sales !== undefined) {
      writePromises.push(saveCollectionSafely(userId, 'sales', data.sales, now));
    }

    // 3. Daily WhatsApp Sales Records (with auto-chunking & image optimization)
    if (data.dailyRecords !== undefined) {
      writePromises.push(saveCollectionSafely(userId, 'dailyRecords', data.dailyRecords, now));
    }

    // 4. Meta Ads Expenses
    if (data.metaExpenses !== undefined) {
      writePromises.push(saveCollectionSafely(userId, 'metaExpenses', data.metaExpenses, now));
    }

    // 5. Pricing Calculator Records
    if (data.pricingRecords !== undefined) {
      writePromises.push(saveCollectionSafely(userId, 'pricingRecords', data.pricingRecords, now));
    }

    // 6. Indirect Costs
    if (data.indirectCosts !== undefined) {
      writePromises.push(saveCollectionSafely(userId, 'indirectCosts', data.indirectCosts, now));
    }

    // 7. WhatsApp Quick-Reply Templates
    if (data.templates !== undefined) {
      writePromises.push(saveCollectionSafely(userId, 'templates', data.templates, now));
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
 * Helper to process snapshot docs and assemble single & chunked collections
 */
function parseUserDataSnapshot(snapshotDocs: Array<{ id: string; data: () => any }>, userId: string): { state: UserCloudState; foundAnyData: boolean } {
  const state: UserCloudState = {
    userId,
    updatedAt: new Date().toISOString(),
  };

  const chunkBuckets: Record<string, { [chunkIndex: number]: any[] }> = {};
  let foundAnyData = false;

  snapshotDocs.forEach((docSnap) => {
    const docId = docSnap.id;
    const data = docSnap.data();

    // Check if this is a chunk document (e.g. dailyRecords_chunk_0)
    if (docId.includes('_chunk_')) {
      const parts = docId.split('_chunk_');
      const collectionKey = parts[0];
      const chunkIndex = data.chunkIndex !== undefined ? Number(data.chunkIndex) : parseInt(parts[1], 10) || 0;
      
      if (!chunkBuckets[collectionKey]) {
        chunkBuckets[collectionKey] = {};
      }
      if (Array.isArray(data.items)) {
        chunkBuckets[collectionKey][chunkIndex] = data.items;
        foundAnyData = true;
      }
      return;
    }

    // Direct documents
    if (docId === 'products' && !data.isChunked && Array.isArray(data.items || data.products)) {
      state.products = (data.items || data.products) as Product[];
      foundAnyData = true;
    } else if (docId === 'sales' && !data.isChunked && Array.isArray(data.items || data.sales)) {
      state.sales = (data.items || data.sales) as Sale[];
      foundAnyData = true;
    } else if (docId === 'dailyRecords' && !data.isChunked && Array.isArray(data.items || data.dailyRecords)) {
      state.dailyRecords = (data.items || data.dailyRecords) as DailySaleRecord[];
      foundAnyData = true;
    } else if (docId === 'metaExpenses' && !data.isChunked && Array.isArray(data.items || data.metaExpenses)) {
      state.metaExpenses = (data.items || data.metaExpenses) as MetaAdExpense[];
      foundAnyData = true;
    } else if (docId === 'pricingRecords' && !data.isChunked && Array.isArray(data.items || data.pricingRecords)) {
      state.pricingRecords = (data.items || data.pricingRecords) as PricingCalculationRecord[];
      foundAnyData = true;
    } else if (docId === 'indirectCosts' && !data.isChunked && Array.isArray(data.items || data.indirectCosts)) {
      state.indirectCosts = (data.items || data.indirectCosts) as IndirectCost[];
      foundAnyData = true;
    } else if (docId === 'templates' && !data.isChunked && Array.isArray(data.items || data.templates)) {
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

  // Reassemble chunked collections
  for (const [collectionKey, chunks] of Object.entries(chunkBuckets)) {
    const sortedIndices = Object.keys(chunks).map(Number).sort((a, b) => a - b);
    const mergedItems: any[] = [];
    for (const idx of sortedIndices) {
      if (Array.isArray(chunks[idx])) {
        mergedItems.push(...chunks[idx]);
      }
    }

    if (mergedItems.length > 0) {
      (state as any)[collectionKey] = mergedItems;
      foundAnyData = true;
    }
  }

  return { state, foundAnyData };
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

    const { state, foundAnyData } = parseUserDataSnapshot(collectionSnap.docs, userId);
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

      const { state, foundAnyData } = parseUserDataSnapshot(snapshot.docs, userId);
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

