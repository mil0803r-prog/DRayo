import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface AppUserSession {
  accountId: string;
  username: string;
  email: string;
  displayName: string;
  isLoggedIn: boolean;
}

const SESSION_KEY = 'drayo_active_user_session_v1';

// Native Web Crypto SHA-256 Hashing
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password.trim() + '_drayo_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Normalize username / email into safe Firestore document key
export function normalizeAccountKey(identifier: string): string {
  return identifier
    .trim()
    .toLowerCase()
    .replace(/[@.]/g, '_')
    .replace(/[^a-z0-9_-]/g, '');
}

export function getSavedSession(): AppUserSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(session: AppUserSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// Register a new user in Firestore Cloud Database
export async function registerCloudAccount(
  username: string,
  email: string,
  plainPassword: string
): Promise<AppUserSession> {
  const trimmedUser = username.trim();
  if (!trimmedUser) {
    throw new Error('Por favor ingresa un nombre o usuario');
  }
  if (!plainPassword || plainPassword.length < 3) {
    throw new Error('La contraseña debe tener al menos 3 caracteres');
  }

  const primaryKey = normalizeAccountKey(trimmedUser);
  const emailKey = email.trim() ? normalizeAccountKey(email.trim()) : null;

  // Check if primary username already exists in Firestore
  const primaryDocRef = doc(db, 'accounts', primaryKey);
  const primaryDocSnap = await getDoc(primaryDocRef);

  if (primaryDocSnap.exists()) {
    throw new Error('Este nombre de usuario ya está registrado. Por favor inicia sesión.');
  }

  // If email was provided, also check if email already exists
  if (emailKey && emailKey !== primaryKey) {
    const emailDocRef = doc(db, 'accounts', emailKey);
    const emailDocSnap = await getDoc(emailDocRef);
    if (emailDocSnap.exists()) {
      throw new Error('Este correo ya está registrado con otra cuenta.');
    }
  }

  const passwordHash = await hashPassword(plainPassword);
  const accountId = 'acc_' + primaryKey + '_' + Date.now().toString(36);

  const accountData = {
    accountId,
    username: trimmedUser,
    email: email.trim().toLowerCase() || `${primaryKey}@drayo.local`,
    displayName: trimmedUser,
    passwordHash,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save to primary username record
  await setDoc(primaryDocRef, accountData);

  // If email provided, save alias pointer so user can log in with either username or email
  if (emailKey && emailKey !== primaryKey) {
    await setDoc(doc(db, 'accounts', emailKey), accountData);
  }

  const session: AppUserSession = {
    accountId,
    username: trimmedUser,
    email: accountData.email,
    displayName: trimmedUser,
    isLoggedIn: true,
  };

  saveSession(session);
  return session;
}

// Log in an existing user from any device
export async function loginCloudAccount(
  identifier: string,
  plainPassword: string
): Promise<AppUserSession> {
  const cleanIdentifier = identifier.trim();
  if (!cleanIdentifier) {
    throw new Error('Por favor ingresa tu usuario o correo');
  }
  if (!plainPassword) {
    throw new Error('Por favor ingresa tu contraseña');
  }

  const key = normalizeAccountKey(cleanIdentifier);
  const docRef = doc(db, 'accounts', key);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Usuario o correo no encontrado. Verifica los datos o crea una cuenta nueva.');
  }

  const data = docSnap.data() as {
    accountId: string;
    username: string;
    email: string;
    displayName: string;
    passwordHash: string;
  };

  const inputHash = await hashPassword(plainPassword);
  if (data.passwordHash !== inputHash) {
    throw new Error('Contraseña incorrecta. Por favor inténtalo nuevamente.');
  }

  const session: AppUserSession = {
    accountId: data.accountId,
    username: data.username || cleanIdentifier,
    email: data.email || cleanIdentifier,
    displayName: data.displayName || data.username || cleanIdentifier,
    isLoggedIn: true,
  };

  saveSession(session);
  return session;
}
