// Master Password System for AI Integration Course
// This allows admin access to all lessons without subscription.
//
// FIX (pre-existing browser crash — VULN-06):
//   The original implementation called require('@google-cloud/secret-manager') directly
//   in browser code. The Node.js Secret Manager SDK cannot run in a browser environment
//   and caused a runtime crash in production builds.
//
//   Resolution: Password validation is now delegated to a Firebase Callable Function
//   (validateMasterPassword) which runs server-side and has access to Secret Manager.
//   The client never sees the master password value — it only receives a boolean result.
import { getFunctions, httpsCallable } from 'firebase/functions';

const validatePasswordViaFunction = async (password: string): Promise<boolean> => {
  try {
    const functions = getFunctions();
    const validate = httpsCallable<{ password: string }, { valid: boolean }>(
      functions,
      'validateMasterPassword'
    );
    const result = await validate({ password });
    return result.data.valid === true;
  } catch (error) {
    console.error('[masterPassword] Callable function error:', error);
    return false;
  }
};

export interface MasterPasswordSession {
  isActive: boolean;
  timestamp: number;
  expiresAt: number;
}

// Session duration: 24 hours
const SESSION_DURATION = 24 * 60 * 60 * 1000;

// Local storage key for master password session
const MASTER_SESSION_KEY = 'aiic_master_session';

/**
 * Validates the master password via a server-side Firebase Callable Function.
 * The raw password is never stored or logged on the client.
 */
export const validateMasterPassword = async (password: string): Promise<boolean> => {
  return validatePasswordViaFunction(password);
};

/**
 * Creates a master password session
 */
export const createMasterSession = (): void => {
  const session: MasterPasswordSession = {
    isActive: true,
    timestamp: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION,
  };
  localStorage.setItem(MASTER_SESSION_KEY, JSON.stringify(session));
  console.log('[masterPassword] Session created — expires in 24 hours');
};

/**
 * Checks if there's an active master password session
 */
export const hasMasterAccess = (): boolean => {
  try {
    const sessionData = localStorage.getItem(MASTER_SESSION_KEY);
    if (!sessionData) return false;

    const session: MasterPasswordSession = JSON.parse(sessionData);

    if (Date.now() > session.expiresAt) {
      clearMasterSession();
      return false;
    }

    return session.isActive;
  } catch (error) {
    console.error('[masterPassword] Error checking master access:', error);
    return false;
  }
};

/**
 * Clears the master password session
 */
export const clearMasterSession = (): void => {
  localStorage.removeItem(MASTER_SESSION_KEY);
  console.log('[masterPassword] Session cleared');
};

/**
 * Gets remaining session time in minutes
 */
export const getMasterSessionTimeRemaining = (): number => {
  try {
    const sessionData = localStorage.getItem(MASTER_SESSION_KEY);
    if (!sessionData) return 0;

    const session: MasterPasswordSession = JSON.parse(sessionData);
    const remaining = session.expiresAt - Date.now();
    return Math.max(0, Math.floor(remaining / (1000 * 60)));
  } catch {
    return 0;
  }
};

/**
 * Extends the master session by another 24 hours
 */
export const extendMasterSession = (): void => {
  if (hasMasterAccess()) {
    createMasterSession();
    console.log('[masterPassword] Session extended');
  }
};
