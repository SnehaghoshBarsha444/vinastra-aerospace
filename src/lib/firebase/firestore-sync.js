/**
 * VINASTRA AEROSPACE — FIRESTORE SYNC MODULE
 * Handles real-time synchronization between in-memory JSON database and Firebase Firestore
 * 
 * This module provides:
 * - Bidirectional sync between local JSON and Firestore
 * - Real-time listeners for dashboard updates
 * - Offline-first architecture with cloud backup
 * - Collection mapping and schema validation
 */

import { getClientFirestore, getServerFirestore } from './admin.js';

// Firestore sync state
let syncEnabled = false;
let syncInterval = null;
let listeners = new Map();

// Collection name mapping (local -> Firestore)
const COLLECTION_MAP = {
  users: 'users',
  projects: 'projects',
  tasks: 'tasks',
  projectMembers: 'projectMembers',
  documents: 'documents',
  institutions: 'institutions',
  researchSubmissions: 'researchSubmissions',
  engineeringReviews: 'engineeringReviews',
  announcements: 'announcements',
  notifications: 'notifications',
  passwordResets: 'passwordResets',
  inquiries: 'inquiries',
  spaceFactorySubsystems: 'spaceFactorySubsystems',
  auditLogs: 'auditLogs'
};

/**
 * Initialize Firestore sync with the in-memory database
 * @param {Object} db - The database instance from db.js
 * @param {Object} options - Sync options
 */
export async function initializeFirestoreSync(db, options = {}) {
  const {
    enableRealtimeSync = true,
    syncIntervalMs = 30000, // 30 seconds
    syncOnStartup = true
  } = options;

  try {
    const clientDb = getClientFirestore();
    if (!clientDb) {
      console.warn('[Firestore Sync] Client Firestore not initialized. Sync disabled.');
      return { success: false, reason: 'Firestore not initialized' };
    }

    syncEnabled = true;
    console.log('[Firestore Sync] Initialized successfully');

    // Perform initial sync if enabled
    if (syncOnStartup) {
      await syncAllCollectionsToFirestore(db);
    }

    // Set up periodic sync
    if (enableRealtimeSync && syncIntervalMs > 0) {
      syncInterval = setInterval(async () => {
        await syncAllCollectionsToFirestore(db);
      }, syncIntervalMs);
      console.log(`[Firestore Sync] Periodic sync enabled (every ${syncIntervalMs}ms)`);
    }

    return { success: true };
  } catch (error) {
    console.error('[Firestore Sync] Initialization failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync all collections to Firestore
 * @param {Object} db - Database instance
 */
export async function syncAllCollectionsToFirestore(db) {
  if (!syncEnabled) return;

  const clientDb = getClientFirestore();
  if (!clientDb) return;

  console.log('[Firestore Sync] Starting full sync...');

  for (const [localName, firestoreName] of Object.entries(COLLECTION_MAP)) {
    try {
      const collection = db.collection(localName);
      if (!collection) continue;

      const documents = collection.find();
      
      // Batch write to Firestore (max 500 operations per batch)
      const batchSize = 500;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = clientDb.batch();
        const chunk = documents.slice(i, i + batchSize);

        chunk.forEach(doc => {
          const docRef = clientDb.collection(firestoreName).doc(doc.id);
          
          // Remove internal fields and convert timestamps
          const firestoreData = prepareForFirestore(doc);
          batch.set(docRef, firestoreData, { merge: true });
        });

        await batch.commit();
      }

      console.log(`[Firestore Sync] Synced ${documents.length} documents to ${firestoreName}`);
    } catch (error) {
      console.error(`[Firestore Sync] Error syncing ${localName}:`, error);
    }
  }

  console.log('[Firestore Sync] Full sync completed');
}

/**
 * Sync a single document to Firestore
 * @param {string} collectionName - Collection name
 * @param {Object} document - Document to sync
 */
export async function syncDocumentToFirestore(collectionName, document) {
  if (!syncEnabled) return;

  const clientDb = getClientFirestore();
  if (!clientDb) return;

  const firestoreName = COLLECTION_MAP[collectionName];
  if (!firestoreName) {
    console.warn(`[Firestore Sync] Unknown collection: ${collectionName}`);
    return;
  }

  try {
    const docRef = clientDb.collection(firestoreName).doc(document.id);
    const firestoreData = prepareForFirestore(document);
    await docRef.set(firestoreData, { merge: true });
    
    console.log(`[Firestore Sync] Synced document ${document.id} to ${firestoreName}`);
  } catch (error) {
    console.error(`[Firestore Sync] Error syncing document ${document.id}:`, error);
  }
}

/**
 * Delete a document from Firestore
 * @param {string} collectionName - Collection name
 * @param {string} documentId - Document ID
 */
export async function deleteDocumentFromFirestore(collectionName, documentId) {
  if (!syncEnabled) return;

  const clientDb = getClientFirestore();
  if (!clientDb) return;

  const firestoreName = COLLECTION_MAP[collectionName];
  if (!firestoreName) return;

  try {
    const docRef = clientDb.collection(firestoreName).doc(documentId);
    await docRef.delete();
    
    console.log(`[Firestore Sync] Deleted document ${documentId} from ${firestoreName}`);
  } catch (error) {
    console.error(`[Firestore Sync] Error deleting document ${documentId}:`, error);
  }
}

/**
 * Prepare document for Firestore (convert dates, remove sensitive fields)
 * @param {Object} doc - Document to prepare
 * @returns {Object} Firestore-ready document
 */
function prepareForFirestore(doc) {
  const firestoreDoc = { ...doc };
  
  // Convert ISO date strings to Firestore timestamps
  const dateFields = ['createdAt', 'updatedAt', 'lastLoginAt', 'deadline', 'expiresAt', 'receivedAt', 'decisionAt'];
  
  dateFields.forEach(field => {
    if (firestoreDoc[field] && typeof firestoreDoc[field] === 'string') {
      // Keep as ISO string for now (Firestore will store as string)
      // Can convert to Timestamp if needed: admin.firestore.Timestamp.fromDate(new Date(doc[field]))
    }
  });

  // Remove sensitive fields
  delete firestoreDoc.passwordHash;
  delete firestoreDoc.salt;

  return firestoreDoc;
}

/**
 * Set up real-time listener for a collection
 * @param {string} collectionName - Collection to listen to
 * @param {Function} callback - Callback function(documents)
 */
export async function listenToCollection(collectionName, callback) {
  if (!syncEnabled) {
    console.warn('[Firestore Sync] Sync not enabled, cannot set up listener');
    return null;
  }

  const clientDb = getClientFirestore();
  if (!clientDb) return null;

  const firestoreName = COLLECTION_MAP[collectionName];
  if (!firestoreName) return null;

  try {
    const unsubscribe = clientDb.collection(firestoreName).onSnapshot((snapshot) => {
      const documents = [];
      snapshot.forEach(doc => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      callback(documents);
    }, (error) => {
      console.error(`[Firestore Sync] Listener error for ${firestoreName}:`, error);
    });

    listeners.set(collectionName, unsubscribe);
    console.log(`[Firestore Sync] Listening to ${firestoreName}`);
    
    return unsubscribe;
  } catch (error) {
    console.error(`[Firestore Sync] Error setting up listener for ${firestoreName}:`, error);
    return null;
  }
}

/**
 * Stop listening to a collection
 * @param {string} collectionName - Collection to stop listening to
 */
export function stopListeningToCollection(collectionName) {
  const unsubscribe = listeners.get(collectionName);
  if (unsubscribe) {
    unsubscribe();
    listeners.delete(collectionName);
    console.log(`[Firestore Sync] Stopped listening to ${collectionName}`);
  }
}

/**
 * Stop all listeners
 */
export function stopAllListeners() {
  listeners.forEach((unsubscribe, collectionName) => {
    unsubscribe();
    console.log(`[Firestore Sync] Stopped listening to ${collectionName}`);
  });
  listeners.clear();
}

/**
 * Stop periodic sync
 */
export function stopPeriodicSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('[Firestore Sync] Periodic sync stopped');
  }
}

/**
 * Shutdown Firestore sync
 */
export function shutdownFirestoreSync() {
  stopAllListeners();
  stopPeriodicSync();
  syncEnabled = false;
  console.log('[Firestore Sync] Shutdown complete');
}

/**
 * Check sync status
 */
export function getSyncStatus() {
  return {
    enabled: syncEnabled,
    periodicSyncActive: syncInterval !== null,
    activeListeners: Array.from(listeners.keys())
  };
}

// Export all functions
export default {
  initializeFirestoreSync,
  syncAllCollectionsToFirestore,
  syncDocumentToFirestore,
  deleteDocumentFromFirestore,
  listenToCollection,
  stopListeningToCollection,
  stopAllListeners,
  stopPeriodicSync,
  shutdownFirestoreSync,
  getSyncStatus
};
