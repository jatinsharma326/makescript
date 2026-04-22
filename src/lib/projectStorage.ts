// Project storage using IndexedDB for full data + localStorage for card list
// IMPORTANT: Storage is USER-SPECIFIC to prevent cross-user data leakage
import { ProjectMeta, ProjectData } from './types';

// Get user-specific storage keys
function getUserStorageKeys(userId: string | null | undefined): { dbName: string; metaKey: string } {
    const userSuffix = userId ? `-${userId}` : '-anonymous';
    return {
        dbName: `makescript-projects${userSuffix}`,
        metaKey: `makescript-project-list${userSuffix}`,
    };
}

// Current user context - must be set before using storage
let currentUserId: string | null = null;

/**
 * Set the current user ID for storage operations.
 * This MUST be called when user logs in/out to ensure proper data isolation.
 */
export function setCurrentUser(userId: string | null): void {
    currentUserId = userId;
    // Clear any cached DB connection when user changes
    // This forces a new DB connection with the correct user's database
}

export function generateProjectId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ==================== IndexedDB ====================

const DB_VERSION = 1;
const STORE_NAME = 'projects';

function openDB(userId: string | null | undefined): Promise<IDBDatabase> {
    const keys = getUserStorageKeys(userId);
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(keys.dbName, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'meta.id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function saveProject(data: ProjectData): Promise<void> {
    if (!currentUserId) {
        console.warn('[ProjectStorage] No user ID set - project may not be properly isolated');
    }
    const db = await openDB(currentUserId);
    const keys = getUserStorageKeys(currentUserId);
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(data);
        tx.oncomplete = () => {
            // Update lightweight meta list in localStorage (user-specific)
            updateMetaList(data.meta, keys.metaKey);
            resolve();
        };
        tx.onerror = () => reject(tx.error);
    });
}

export async function loadProject(id: string): Promise<ProjectData | null> {
    if (!currentUserId) {
        console.warn('[ProjectStorage] No user ID set - loading from anonymous storage');
    }
    const db = await openDB(currentUserId);
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

export async function deleteProject(id: string): Promise<void> {
    if (!currentUserId) {
        console.warn('[ProjectStorage] No user ID set - deleting from anonymous storage');
    }
    const db = await openDB(currentUserId);
    const keys = getUserStorageKeys(currentUserId);
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => {
            removeFromMetaList(id, keys.metaKey);
            resolve();
        };
        tx.onerror = () => reject(tx.error);
    });
}

export async function deleteAllProjects(): Promise<void> {
    if (!currentUserId) {
        console.warn('[ProjectStorage] No user ID set - clearing anonymous storage');
    }
    const db = await openDB(currentUserId);
    const keys = getUserStorageKeys(currentUserId);
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
        tx.oncomplete = () => {
            localStorage.removeItem(keys.metaKey);
            resolve();
        };
        tx.onerror = () => reject(tx.error);
    });
}

/**
 * Clear all data for a specific user (used when logging out)
 */
export async function clearUserData(userId: string): Promise<void> {
    const keys = getUserStorageKeys(userId);
    // Clear localStorage meta
    localStorage.removeItem(keys.metaKey);
    // Note: IndexedDB database persists but will be empty when user logs back in
    // We could delete the entire database, but that's more complex
    // For now, just clear the contents
    try {
        const db = await openDB(userId);
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
        await new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
        db.close();
        // Delete the database entirely
        indexedDB.deleteDatabase(keys.dbName);
    } catch (e) {
        console.warn('[ProjectStorage] Error clearing user data:', e);
    }
}

// ==================== localStorage meta list ====================

function updateMetaList(meta: ProjectMeta, metaKey: string): void {
    const list = getProjectListByKey(metaKey);
    const idx = list.findIndex(m => m.id === meta.id);
    if (idx >= 0) {
        list[idx] = meta;
    } else {
        list.unshift(meta);
    }
    localStorage.setItem(metaKey, JSON.stringify(list));
}

function removeFromMetaList(id: string, metaKey: string): void {
    const list = getProjectListByKey(metaKey).filter(m => m.id !== id);
    localStorage.setItem(metaKey, JSON.stringify(list));
}

function getProjectListByKey(metaKey: string): ProjectMeta[] {
    try {
        const raw = localStorage.getItem(metaKey);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function getProjectList(): ProjectMeta[] {
    if (!currentUserId) {
        console.warn('[ProjectStorage] No user ID set - returning empty list');
        return [];
    }
    const keys = getUserStorageKeys(currentUserId);
    return getProjectListByKey(keys.metaKey);
}

// ==================== Helpers ====================

/**
 * Reconstruct a File object from stored ArrayBuffer
 */
export function reconstructFile(buffer: ArrayBuffer, name: string, type: string): File {
  return new File([buffer], name, { type });
}
