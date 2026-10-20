/**
 * VINASTRA AEROSPACE — DUAL FIREBASE ADMIN MODULE (SERVER-SIDE ONLY)
 * 
 * This module manages TWO Firebase Admin instances:
 * 1. Client Project Admin (vinastra-aerospace-clientside)
 * 2. Admin Project Admin (vinastra-aerospace-serverside)
 * 
 * ============================================================
 * CRITICAL SECURITY REQUIREMENTS
 * ============================================================
 * 
 * THIS MODULE MUST ONLY BE USED IN SERVER-SIDE CODE
 * 
 * 1. NEVER import this module in client-side code
 * 2. NEVER expose service account credentials to the browser
 * 3. NEVER include this file in client-side bundles
 * 4. Always verify user identity server-side before privileged operations
 * 5. Use environment variables for all sensitive credentials
 * 
 * The service account private keys are stored in environment variables
 * and NEVER committed to version control.
 * 
 * ============================================================
 * USAGE EXAMPLE (SERVER-SIDE ONLY)
 * ============================================================
 * 
 * // Verify client Firebase token
 * import { verifyClientToken } from './src/lib/firebase/admin.js';
 * const decodedToken = await verifyClientToken(idToken);
 * 
 * // Get user from client Firestore
 * import { getClientFirestore } from './src/lib/firebase/admin.js';
 * const clientDb = getClientFirestore();
 * const userDoc = await clientDb.collection('users').doc(uid).get();
 */

// Note: firebase-admin will be imported dynamically when needed
// This prevents errors when the module is accidentally loaded in browser
let admin = null;
let clientAdmin = null;
let serverAdmin = null;
let clientAuth = null;
let clientDb = null;
let serverAuth = null;
let serverDb = null;
let isInitialized = false;

// ============================================================
// ENVIRONMENT VARIABLE VALIDATION
// ============================================================

/**
 * Validate that required environment variables are set for client admin
 * @throws Error if any required variable is missing
 */
function validateClientAdminCredentials() {
  const required = [
    'FIREBASE_CLIENT_ADMIN_PROJECT_ID',
    'FIREBASE_CLIENT_ADMIN_CLIENT_EMAIL',
    'FIREBASE_CLIENT_ADMIN_PRIVATE_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `[Firebase Client Admin] Missing required environment variables: ${missing.join(', ')}. ` +
      'Please set these variables in your .env file. ' +
      'See .env.example for reference.'
    );
  }
}

/**
 * Validate that required environment variables are set for server admin
 * @returns {boolean} True if credentials are available
 */
function validateServerAdminCredentials() {
  const required = [
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY'
  ];
  
  return required.every(key => process.env[key]);
}

// ============================================================
// FIREBASE ADMIN CONFIGURATION
// ============================================================

// Helper function to convert \n string literals to actual newlines
function formatPrivateKey(key) {
  if (!key) return null;
  // If the key contains literal \n, convert to actual newlines
  return key.replace(/\\n/g, '\n');
}

// Get Firebase Admin config (called after env vars are loaded)
function getClientAdminConfig() {
  return {
    projectId: process.env.FIREBASE_CLIENT_ADMIN_PROJECT_ID || "vinastra-aerospace-clientside",
    clientEmail: process.env.FIREBASE_CLIENT_ADMIN_CLIENT_EMAIL,
    privateKey: formatPrivateKey(process.env.FIREBASE_CLIENT_ADMIN_PRIVATE_KEY),
    storageBucket: "vinastra-aerospace-clientside.firebasestorage.app"
  };
}

function getServerAdminConfig() {
  return {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "vinastra-aerospace-serverside",
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: formatPrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY),
    storageBucket: "vinastra-aerospace-serverside.firebasestorage.app"
  };
}

// ============================================================
// FIREBASE ADMIN INITIALIZATION
// ============================================================

let initializationError = null;

/**
 * Initialize Firebase Admin SDKs
 * Should only be called in server-side code
 * 
 * @returns {Object} Firebase Admin instances
 */
async function initializeFirebaseAdmin() {
  // Return cached instance if already initialized
  if (isInitialized && clientAdmin && clientAuth && clientDb) {
    return { 
      clientAdmin, 
      clientAuth, 
      clientDb, 
      serverAdmin, 
      serverAuth, 
      serverDb 
    };
  }
  
  // Check if running on server
  if (typeof window !== 'undefined') {
    throw new Error(
      '[Firebase Admin] CRITICAL: This module must ONLY be used in server-side code. ' +
      'Never import or call this module from client-side code.'
    );
  }
  
  try {
    // Dynamically import firebase-admin (server-side only)
    const adminModule = await import('firebase-admin');
    admin = adminModule.default || adminModule;
    
    // Get configs AFTER env vars are loaded
    const clientConfig = getClientAdminConfig();
    const serverConfig = getServerAdminConfig();
    
    // Initialize Client Project Admin (REQUIRED)
    validateClientAdminCredentials();
    
    clientAdmin = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: clientConfig.projectId,
        clientEmail: clientConfig.clientEmail,
        privateKey: clientConfig.privateKey
      }),
      projectId: clientConfig.projectId,
      storageBucket: clientConfig.storageBucket
    }, 'vinastra-client-admin');
    
    clientAuth = admin.auth(clientAdmin);
    clientDb = admin.firestore(clientAdmin);
    
    console.log('[Firebase Client Admin] Successfully initialized');
    console.log('[Firebase Client Admin] Project ID:', clientConfig.projectId);
    
    // Initialize Server Project Admin (OPTIONAL - for Mission Control Admin Portal)
    if (validateServerAdminCredentials()) {
      try {
        serverAdmin = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: serverConfig.projectId,
            clientEmail: serverConfig.clientEmail,
            privateKey: serverConfig.privateKey
          }),
          projectId: serverConfig.projectId,
          storageBucket: serverConfig.storageBucket
        }, 'vinastra-server-admin');
        
        serverAuth = admin.auth(serverAdmin);
        serverDb = admin.firestore(serverAdmin);
        
        console.log('[Firebase Server Admin] Successfully initialized');
        console.log('[Firebase Server Admin] Project ID:', serverConfig.projectId);
      } catch (error) {
        console.warn('[Firebase Server Admin] Failed to initialize (optional):', error.message);
      }
    } else {
      console.log('[Firebase Server Admin] Credentials not configured (optional)');
    }
    
    isInitialized = true;
    
    return { 
      clientAdmin, 
      clientAuth, 
      clientDb, 
      serverAdmin, 
      serverAuth, 
      serverDb 
    };
  } catch (error) {
    initializationError = error;
    console.error('[Firebase Admin] Initialization failed:', error);
    throw error;
  }
}

// ============================================================
// AUTHENTICATION VERIFICATION
// ============================================================

/**
 * Verify Firebase ID token from client Firebase Auth
 * 
 * @param {string} idToken - Firebase ID token from client
 * @returns {Promise<Object>} Decoded token with user claims
 * @throws Error if token is invalid or expired
 */
async function verifyClientToken(idToken) {
  if (!idToken) {
    throw new Error('[Firebase Admin] ID token is required');
  }
  
  try {
    // Initialize if not already done
    if (!isInitialized) {
      await initializeFirebaseAdmin();
    }
    
    // Verify token using Client Firebase Admin
    const decodedToken = await clientAuth.verifyIdToken(idToken);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
      // Custom claims (if set)
      role: decodedToken.role || 'STUDENT',
      institutionId: decodedToken.institutionId || null,
      permissions: decodedToken.permissions || []
    };
  } catch (error) {
    console.error('[Firebase Admin] Token verification failed:', error);
    
    if (error.code === 'auth/id-token-expired') {
      throw new Error('Session expired. Please log in again.');
    } else if (error.code === 'auth/id-token-revoked') {
      throw new Error('Session has been revoked. Please log in again.');
    } else if (error.code === 'auth/invalid-id-token') {
      throw new Error('Invalid authentication token');
    }
    
    throw new Error('Authentication verification failed');
  }
}

/**
 * Legacy function name - calls verifyClientToken
 */
const verifyIdToken = verifyClientToken;

/**
 * Set custom claims for a user in Client Firebase (role, permissions, etc.)
 * 
 * @param {string} uid - User ID
 * @param {Object} claims - Custom claims to set
 * @returns {Promise<void>}
 */
async function setUserCustomClaims(uid, claims) {
  try {
    if (!isInitialized) {
      await initializeFirebaseAdmin();
    }
    
    await clientAuth.setCustomUserClaims(uid, claims);
    console.log('[Firebase Admin] Custom claims set for user:', uid);
  } catch (error) {
    console.error('[Firebase Admin] Failed to set custom claims:', error);
    throw error;
  }
}

/**
 * Get user by UID from Client Firebase
 * 
 * @param {string} uid - User ID
 * @returns {Promise<Object>} User record
 */
async function getUserByUid(uid) {
  try {
    if (!isInitialized) {
      await initializeFirebaseAdmin();
    }
    
    const userRecord = await clientAuth.getUser(uid);
    
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      disabled: userRecord.disabled,
      metadata: userRecord.metadata,
      customClaims: userRecord.customClaims || {}
    };
  } catch (error) {
    console.error('[Firebase Admin] Failed to get user:', error);
    throw error;
  }
}

/**
 * Get user by email from Client Firebase
 * 
 * @param {string} email - User email
 * @returns {Promise<Object>} User record
 */
async function getUserByEmail(email) {
  try {
    if (!isInitialized) {
      await initializeFirebaseAdmin();
    }
    
    const userRecord = await clientAuth.getUserByEmail(email);
    
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      displayName: userRecord.displayName,
      customClaims: userRecord.customClaims || {}
    };
  } catch (error) {
    console.error('[Firebase Admin] Failed to get user by email:', error);
    throw error;
  }
}

/**
 * List all users from Client Firebase (paginated)
 * 
 * @param {number} maxResults - Maximum results per page
 * @param {string} pageToken - Next page token
 * @returns {Promise<Object>} List of users and next page token
 */
async function listUsers(maxResults = 1000, pageToken) {
  try {
    if (!isInitialized) {
      await initializeFirebaseAdmin();
    }
    
    const result = await clientAuth.listUsers(maxResults, pageToken);
    
    return {
      users: result.users.map(user => ({
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        disabled: user.disabled,
        customClaims: user.customClaims || {}
      })),
      pageToken: result.pageToken
    };
  } catch (error) {
    console.error('[Firebase Admin] Failed to list users:', error);
    throw error;
  }
}

// ============================================================
// FIRESTORE OPERATIONS
// ============================================================

/**
 * Get Client Firestore instance (for user profiles, etc.)
 * 
 * @returns {FirebaseFirestore.Firestore} Client Firestore instance
 */
function getClientFirestore() {
  if (!isInitialized) {
    initializeFirebaseAdmin();
  }
  
  return clientDb;
}

/**
 * Get Server Firestore instance (for admin data, audit logs, etc.)
 * 
 * @returns {FirebaseFirestore.Firestore} Server Firestore instance or null
 */
function getServerFirestore() {
  if (!isInitialized) {
    initializeFirebaseAdmin();
  }
  
  return serverDb;
}

/**
 * Legacy function name - returns Client Firestore
 */
const getAdminFirestore = getClientFirestore;

/**
 * Verify user has required role
 * 
 * @param {string} uid - User ID
 * @param {Array<string>} allowedRoles - Array of allowed roles
 * @returns {Promise<boolean>} True if user has required role
 */
async function verifyUserRole(uid, allowedRoles) {
  try {
    const user = await getUserByUid(uid);
    const userRole = user.customClaims?.role || 'STUDENT';
    
    return allowedRoles.includes(userRole);
  } catch (error) {
    console.error('[Firebase Admin] Role verification failed:', error);
    return false;
  }
}

/**
 * Create audit log entry
 * Writes to Server Firestore if available, otherwise to Client Firestore
 * 
 * @param {Object} params - Audit log parameters
 * @returns {Promise<void>}
 */
async function createAuditLog({ userId, action, resourceType, resourceId, details, ipAddress, userAgent }) {
  try {
    if (!isInitialized) {
      await initializeFirebaseAdmin();
    }
    
    const logData = {
      userId: userId || 'ANONYMOUS',
      action,
      resourceType,
      resourceId: resourceId || null,
      details: details || null,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Prefer Server Firestore for audit logs, fallback to Client Firestore
    const targetDb = serverDb || clientDb;
    
    await targetDb.collection('auditLogs').add(logData);
    
    console.log('[Firebase Admin] Audit log created:', action);
  } catch (error) {
    console.error('[Firebase Admin] Failed to create audit log:', error);
    // Don't throw - audit logging should not break operations
  }
}

// ============================================================
// MODULE STATUS CHECKS
// ============================================================

/**
 * Check if Firebase Admin is properly configured
 * 
 * @returns {Object} Configuration status
 */
function checkAdminStatus() {
  const clientConfig = getClientAdminConfig();
  const serverConfig = getServerAdminConfig();
  
  return {
    isInitialized,
    hasError: !!initializationError,
    error: initializationError?.message || null,
    clientAdmin: {
      hasCredentials: !!(process.env.FIREBASE_CLIENT_ADMIN_PROJECT_ID && 
                         process.env.FIREBASE_CLIENT_ADMIN_CLIENT_EMAIL && 
                         process.env.FIREBASE_CLIENT_ADMIN_PRIVATE_KEY),
      projectId: clientConfig.projectId
    },
    serverAdmin: {
      hasCredentials: validateServerAdminCredentials(),
      projectId: serverConfig.projectId
    }
  };
}

/**
 * Check if this module is being used in server-side context
 * 
 * @returns {boolean} True if running on server
 */
function isServerSide() {
  return typeof window === 'undefined';
}

// ============================================================
// MODULE EXPORTS
// ============================================================

const exports = {
  // Initialization
  initializeFirebaseAdmin,
  checkAdminStatus,
  isServerSide,
  
  // Authentication
  verifyIdToken,
  verifyClientToken,
  setUserCustomClaims,
  getUserByUid,
  getUserByEmail,
  listUsers,
  
  // Firestore
  getClientFirestore,
  getServerFirestore,
  getAdminFirestore, // Legacy alias
  verifyUserRole,
  createAuditLog,
  
  // Config getters (non-sensitive)
  getClientAdminConfig,
  getServerAdminConfig
};

export default exports;

export {
  initializeFirebaseAdmin,
  checkAdminStatus,
  isServerSide,
  verifyIdToken,
  verifyClientToken,
  setUserCustomClaims,
  getUserByUid,
  getUserByEmail,
  listUsers,
  getClientFirestore,
  getServerFirestore,
  getAdminFirestore,
  verifyUserRole,
  createAuditLog
};

// ============================================================
// USAGE DOCUMENTATION
// ============================================================

/**
 * HOW TO USE THIS MODULE (SERVER-SIDE ONLY):
 * 
 * 1. Set environment variables:
 *    FIREBASE_ADMIN_PROJECT_ID=vinastra-aerospace-serverside
 *    FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@vinastra-aerospace-serverside.iam.gserviceaccount.com
 *    FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
 * 
 * 2. Import in server-side code:
 *    import { verifyIdToken, getAdminFirestore } from './src/lib/firebase/admin.js';
 * 
 * 3. Verify user token before privileged operations:
 *    const decodedToken = await verifyIdToken(idToken);
 *    if (decodedToken.role !== 'ADMIN') {
 *      return res.status(403).json({ error: 'Forbidden' });
 *    }
 * 
 * 4. Perform privileged operations:
 *    const db = getAdminFirestore();
 *    await db.collection('confidentialDocuments').doc(docId).get();
 * 
 * 5. Log administrative actions:
 *    await createAuditLog({
 *      userId: decodedToken.uid,
 *      action: 'DOCUMENT_ACCESSED',
 *      resourceType: 'DOCUMENT',
 *      resourceId: docId,
 *      ipAddress: req.ip,
 *      userAgent: req.headers['user-agent']
 *    });
 * 
 * IMPORTANT:
 * - NEVER import this in client-side code
 * - NEVER expose service account credentials to the browser
 * - ALWAYS verify user identity before privileged operations
 * - Use Firebase Security Rules as an additional layer of protection
 */
