// Project storage using IndexedDB for full data + localStorage for card list
import { ProjectMeta, ProjectData } from './types';

const DB_NAME = 'makescript-projects';
const DB_VERSION = 1;
const STORE_NAME = 'projects';
const META_KEY = 'makescript-project-list';

export function generateProjectId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ==================== IndexedDB ====================

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
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
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(data);
    tx.oncomplete = () => {
      // Update lightweight meta list in localStorage
      updateMetaList(data.meta);
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadProject(id: string): Promise<ProjectData | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => {
      removeFromMetaList(id);
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteAllProjects(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => {
      localStorage.removeItem(META_KEY);
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

// ==================== localStorage meta list ====================

function updateMetaList(meta: ProjectMeta): void {
  const list = getProjectList();
  const idx = list.findIndex(m => m.id === meta.id);
  if (idx >= 0) {
    list[idx] = meta;
  } else {
    list.unshift(meta);
  }
  localStorage.setItem(META_KEY, JSON.stringify(list));
}

function removeFromMetaList(id: string): void {
  const list = getProjectList().filter(m => m.id !== id);
  localStorage.setItem(META_KEY, JSON.stringify(list));
}

export function getProjectList(): ProjectMeta[] {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ==================== Helpers ====================

/**
 * Reconstruct a File object from stored ArrayBuffer
 */
export function reconstructFile(buffer: ArrayBuffer, name: string, type: string): File {
  return new File([buffer], name, { type });
}
