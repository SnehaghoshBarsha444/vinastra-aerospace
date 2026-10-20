/**
 * VINASTRA AEROSPACE — CLIENT FIREBASE MODULE
 * 
 * Firebase Integration A: Client-side authentication and Firestore database
 * Project: vinastra-aerospace-clientside
 * 
 * This module handles:
 * - Client-side user authentication (students, researchers, investors)
 * - User profile management in Firestore
 * - University collaboration data
 * - Research submission tracking
 * 
 * SECURITY NOTES:
 * - Firebase client credentials ARE visible in browser code (expected)
 * - Protect data with Firestore Security Rules, not hidden credentials
 * - Restrict API key to specific domains in Firebase Console
 * - Never store sensitive admin credentials in client code
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { 
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  verifyBeforeUpdateEmail
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { 
  getAnalytics,
  initializeAnalytics,
  isSupported as isAnalyticsSupported 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js';

// ============================================================
// FIREBASE CLIENT CONFIGURATION
// Project: vinastra-aerospace-clientside
// ============================================================

const FIREBASE_CLIENT_CONFIG = {
  apiKey: "AIzaSyDbaUl5GYen5EpQj1wg9o9pRRA56Fn_Nuo",
  authDomain: "vinastra-aerospace-clientside.firebaseapp.com",
  projectId: "vinastra-aerospace-clientside",
  storageBucket: "vinastra-aerospace-clientside.firebasestorage.app",
  messagingSenderId: "843403997865",
  appId: "1:843403997865:web:53d80c9d11bbb185e76fb8",
  measurementId: "G-T0YSY506WX"
};

// ============================================================
// FIREBASE INITIALIZATION
// ============================================================

let app = null;
let auth = null;
let db = null;
let analytics = null;
let initializationError = null;

/**
 * Initialize Firebase Client SDK
 * Should be called once when the application loads
 */
function initializeFirebaseClient() {
  if (app) {
    console.warn('[Firebase Client] Already initialized');
    return { app, auth, db, analytics };
  }

  try {
    // Initialize Firebase App
    app = initializeApp(FIREBASE_CLIENT_CONFIG);
    
    // Initialize Authentication
    auth = getAuth(app);
    
    // Initialize Firestore
    db = getFirestore(app);
    
    // Initialize Analytics (only in browser with HTTP/HTTPS)
    if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
      try {
        const isPublicSuffix = 
          window.location.hostname.endsWith('.vercel.app') || 
          window.location.hostname.endsWith('.github.io');
        
        analytics = initializeAnalytics(app, {
          config: {
            cookie_domain: isPublicSuffix ? window.location.hostname : 'auto',
            cookie_flags: 'SameSite=Lax;Secure'
          }
        });
      } catch (analyticsError) {
        console.warn('[Firebase Client] Analytics initialization failed:', analyticsError.message);
      }
    }

    console.log('[Firebase Client] Successfully initialized');
    console.log('[Firebase Client] Project ID:', FIREBASE_CLIENT_CONFIG.projectId);
    
    return { app, auth, db, analytics };
  } catch (error) {
    initializationError = error;
    console.error('[Firebase Client] Initialization failed:', error);
    throw error;
  }
}

// ============================================================
// USER PROFILE SCHEMA (FIRESTORE)
// ============================================================

/**
 * Create a user profile object for Firestore
 * @param {Object} params - User profile parameters
 * @returns {Object} Firestore user document
 */
function createUserProfile({ uid, name, email, role, institutionId = null, department = null }) {
  return {
    id: uid,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: role || 'STUDENT', // Safe default role
    institutionId: institutionId,
    department: department ? department.trim() : null,
    status: 'ACTIVE',
    emailVerified: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: null,
    profile: {
      avatar: null,
      bio: null,
      title: null,
      organization: null
    },
    preferences: {
      notifications: true,
      theme: 'dark'
    }
  };
}

// ============================================================
// AUTHENTICATION FUNCTIONS
// ============================================================

/**
 * Register a new user with email and password
 * @param {Object} params - Registration parameters
 * @returns {Promise<Object>} User profile and Firebase user
 */
async function registerUser({ name, email, password, role, institutionId, department }) {
  // Validate inputs
  if (!name || !name.trim()) {
    throw new Error('Full name is required');
  }
  
  const cleanEmail = email.trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) {
    throw new Error('Invalid email address');
  }
  
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  // Validate role (prevent privilege escalation)
  const allowedRoles = ['students', 'STUDENT', 'professional', 'ENGINEER', 'investor', 'INVESTOR'];
  if (!allowedRoles.includes(role)) {
    console.warn('[Firebase Client] Invalid role provided, defaulting to STUDENT');
    role = 'STUDENT';
  }
  
  // Map frontend role to system role
  const systemRole = mapClientRoleToSystem(role);

  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, { displayName: name.trim() });

    // Create user profile in Firestore
    const userProfile = createUserProfile({
      uid: user.uid,
      name: name.trim(),
      email: cleanEmail,
      role: systemRole,
      institutionId,
      department
    });

    // Save to Firestore users collection
    await setDoc(doc(db, 'users', user.uid), userProfile);

    console.log('[Firebase Client] User registered successfully:', user.uid);

    return {
      user,
      profile: {
        id: user.uid,
        name: name.trim(),
        email: cleanEmail,
        role: systemRole,
        institutionId,
        department
      }
    };
  } catch (error) {
    console.error('[Firebase Client] Registration failed:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use a stronger password');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address format');
    } else if (error.code === 'auth/configuration-not-found') {
      console.warn('[Firebase Client] Email/Password auth not enabled in Firebase Console');
      throw new Error('Authentication is not properly configured. Please contact support.');
    }
    
    throw error;
  }
}

/**
 * Sign in user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User profile
 */
async function loginUser(email, password) {
  const cleanEmail = email.trim().toLowerCase();
  
  if (!isValidEmail(cleanEmail)) {
    throw new Error('Invalid email address');
  }
  
  if (!password) {
    throw new Error('Password is required');
  }

  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCredential.user;

    // Fetch user profile from Firestore
    const profile = await fetchUserProfile(user.uid);
    
    // Update last login time
    if (profile) {
      await updateDoc(doc(db, 'users', user.uid), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    console.log('[Firebase Client] User logged in successfully:', user.uid);

    return {
      user,
      profile: profile || {
        id: user.uid,
        name: user.displayName || cleanEmail.split('@')[0],
        email: cleanEmail,
        role: 'STUDENT'
      }
    };
  } catch (error) {
    console.error('[Firebase Client] Login failed:', error);
    
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password');
    } else if (error.code === 'auth/invalid-credential') {
      throw new Error('Invalid email or password');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed attempts. Please try again later');
    }
    
    throw error;
  }
}

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
async function logoutUser() {
  try {
    await signOut(auth);
    console.log('[Firebase Client] User signed out');
  } catch (error) {
    console.error('[Firebase Client] Logout failed:', error);
    throw error;
  }
}

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
async function sendPasswordReset(email) {
  const cleanEmail = email.trim().toLowerCase();
  
  if (!isValidEmail(cleanEmail)) {
    throw new Error('Invalid email address');
  }

  try {
    await sendPasswordResetEmail(auth, cleanEmail);
    console.log('[Firebase Client] Password reset email sent');
  } catch (error) {
    console.error('[Firebase Client] Password reset failed:', error);
    
    if (error.code === 'auth/user-not-found') {
      // Don't reveal if user exists
      console.log('[Firebase Client] Password reset requested for non-existent user');
    }
    
    // Always return success to prevent email enumeration
  }
}

// ============================================================
// USER PROFILE FUNCTIONS
// ============================================================

/**
 * Fetch user profile from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<Object|null>} User profile or null
 */
async function fetchUserProfile(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (userDoc.exists()) {
      return userDoc.data();
    }
    
    return null;
  } catch (error) {
    console.error('[Firebase Client] Failed to fetch user profile:', error);
    return null;
  }
}

/**
 * Update user profile in Firestore
 * @param {string} uid - User ID
 * @param {Object} updates - Profile updates
 * @returns {Promise<void>}
 */
async function updateUserProfile(uid, updates) {
  try {
    const allowedUpdates = {
      name: updates.name,
      department: updates.department,
      institutionId: updates.institutionId,
      'profile.avatar': updates.avatar,
      'profile.bio': updates.bio,
      'profile.title': updates.title,
      'profile.organization': updates.organization,
      'preferences.notifications': updates.notifications,
      'preferences.theme': updates.theme,
      updatedAt: serverTimestamp()
    };

    // Remove undefined values
    const cleanUpdates = {};
    for (const [key, value] of Object.entries(allowedUpdates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await updateDoc(doc(db, 'users', uid), cleanUpdates);
    console.log('[Firebase Client] User profile updated:', uid);
  } catch (error) {
    console.error('[Firebase Client] Failed to update profile:', error);
    throw error;
  }
}

// ============================================================
// AUTH STATE MANAGEMENT
// ============================================================

/**
 * Subscribe to authentication state changes
 * @param {Function} callback - Callback function receiving user object
 * @returns {Function} Unsubscribe function
 */
function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const profile = await fetchUserProfile(user.uid);
      callback({
        user,
        profile,
        isAuthenticated: true
      });
    } else {
      callback({
        user: null,
        profile: null,
        isAuthenticated: false
      });
    }
  });
}

/**
 * Get current authenticated user
 * @returns {Object|null} Current user or null
 */
function getCurrentUser() {
  return auth?.currentUser || null;
}

/**
 * Get current user ID token
 * @param {boolean} forceRefresh - Force token refresh
 * @returns {Promise<string|null>} ID token or null
 */
async function getCurrentUserIdToken(forceRefresh = false) {
  const user = getCurrentUser();
  if (!user) return null;
  
  try {
    return await user.getIdToken(forceRefresh);
  } catch (error) {
    console.error('[Firebase Client] Failed to get ID token:', error);
    return null;
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Validate email address format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!regex.test(trimmed)) return false;
  
  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;
  
  const domainParts = parts[1].split('.');
  if (domainParts.length < 2) return false;
  
  const tld = domainParts[domainParts.length - 1];
  return /^[a-zA-Z]{2,24}$/.test(tld);
}

/**
 * Map client role to system role
 * @param {string} clientRole - Role from registration form
 * @returns {string} System role
 */
function mapClientRoleToSystem(clientRole) {
  const roleMap = {
    'students': 'STUDENT',
    'STUDENT': 'STUDENT',
    'professional': 'ENGINEER',
    'ENGINEER': 'ENGINEER',
    'investor': 'INVESTOR',
    'INVESTOR': 'INVESTOR',
    'researcher': 'RESEARCHER',
    'RESEARCHER': 'RESEARCHER'
  };
  
  return roleMap[clientRole] || 'STUDENT'; // Safe default
}

/**
 * Format role for display
 * @param {string} role - System role
 * @returns {string} Display role
 */
function formatRoleForDisplay(role) {
  const displayMap = {
    'STUDENT': 'Student / Academic Researcher',
    'ENGINEER': 'Aerospace Professional / Engineer',
    'INVESTOR': 'Institutional / Angel Investor',
    'RESEARCHER': 'Researcher',
    'COORDINATOR': 'University Coordinator',
    'FELLOW': 'Fellow / Intern',
    'ADVISOR': 'External Advisor'
  };
  
  return displayMap[role] || role || 'Member';
}

// ============================================================
// MODULE EXPORTS
// ============================================================

export {
  // Initialization
  initializeFirebaseClient,
  FIREBASE_CLIENT_CONFIG,
  
  // Authentication
  registerUser,
  loginUser,
  logoutUser,
  sendPasswordReset,
  subscribeToAuthState,
  getCurrentUser,
  getCurrentUserIdToken,
  
  // User Profile
  fetchUserProfile,
  updateUserProfile,
  createUserProfile,
  
  // Firestore instances
  get db() { return db; },
  get auth() { return auth; },
  get app() { return app; },
  
  // Helpers
  isValidEmail,
  mapClientRoleToSystem,
  formatRoleForDisplay
};

// Auto-initialize when module loads (optional)
if (typeof window !== 'undefined') {
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      try {
        initializeFirebaseClient();
      } catch (error) {
        console.error('[Firebase Client] Auto-initialization failed:', error);
      }
    });
  } else {
    // DOM already loaded
    try {
      initializeFirebaseClient();
    } catch (error) {
      console.error('[Firebase Client] Auto-initialization failed:', error);
    }
  }
}
