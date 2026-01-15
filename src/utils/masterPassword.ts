// Master Password System for AI Integration Course
// This allows admin access to all lessons without subscription

// Master password is stored in Google Cloud Secret Manager
const getMasterPassword = async (): Promise<string> => {
  if (process.env.NODE_ENV === 'production') {
    const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({
      name: 'projects/ai-integra-course-v2/secrets/master-password/versions/latest',
    });
    return version.payload.data.toString();
  } else {
    return process.env.MASTER_PASSWORD || 'development-password';
  }
};

export interface MasterPasswordSession {
  isActive: boolean;
  timestamp: number;
  expiresAt: number;
}

// Session duration: 24 hours
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Local storage key for master password session
const MASTER_SESSION_KEY = "aiic_master_session";

/**
 * Validates the master password
 */
export const validateMasterPassword = async (password: string): Promise<boolean> => {
  const masterPassword = await getMasterPassword();
  return password === masterPassword;
};

/**
 * Creates a master password session
 */
export const createMasterSession = (): void => {
  const session: MasterPasswordSession = {
    isActive: true,
    timestamp: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION
  };
  
  localStorage.setItem(MASTER_SESSION_KEY, JSON.stringify(session));
  console.log("Master password session created - expires in 24 hours");
};

/**
 * Checks if there's an active master password session
 */
export const hasMasterAccess = (): boolean => {
  try {
    const sessionData = localStorage.getItem(MASTER_SESSION_KEY);
    if (!sessionData) return false;
    
    const session: MasterPasswordSession = JSON.parse(sessionData);
    
    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      clearMasterSession();
      return false;
    }
    
    return session.isActive;
  } catch (error) {
    console.error("Error checking master access:", error);
    return false;
  }
};

/**
 * Clears the master password session
 */
export const clearMasterSession = (): void => {
  localStorage.removeItem(MASTER_SESSION_KEY);
  console.log("Master password session cleared");
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
    
    return Math.max(0, Math.floor(remaining / (1000 * 60))); // Convert to minutes
  } catch (error) {
    return 0;
  }
};

/**
 * Extends the master session by another 24 hours
 */
export const extendMasterSession = (): void => {
  if (hasMasterAccess()) {
    createMasterSession(); // This will create a new 24-hour session
    console.log("Master password session extended");
  }
};
