/**
 * Data service — wraps Firestore with a localStorage fallback.
 *
 * When Firestore is available (Firebase configured + user signed in), all
 * reads/writes go to Firestore and are also mirrored to localStorage so the
 * app works offline. When Firestore is unavailable the app falls back to
 * localStorage-only mode transparently.
 *
 * Collections live under: users/{uid}/{collection}
 *
 * To enable Firestore:
 *   1. In Firebase Console → Firestore Database → Create database
 *   2. Use the security rules below (or stricter production rules):
 *
 *   rules_version = '2';
 *   service cloud.firestore {
 *     match /databases/{database}/documents {
 *       match /users/{userId}/{document=**} {
 *         allow read, write: if request.auth != null && request.auth.uid == userId;
 *       }
 *     }
 *   }
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

const getDb = () => db;

const uid = (): string | null => auth?.currentUser?.uid ?? null;

const userCol = (col: string) => {
  const db = getDb();
  const userId = uid();
  if (!db || !userId) return null;
  return collection(db, 'users', userId, col);
};

// ── Local storage helpers ──────────────────────────────────────────────────

const ls = {
  get: <T>(key: string): T[] => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) || '[]');
      return Array.isArray(parsed) ? parsed as T[] : [];
    } catch { return []; }
  },
  set: <T>(key: string, data: T[]) => {
    window.localStorage.setItem(key, JSON.stringify(data));
  },
};

// ── Core CRUD ──────────────────────────────────────────────────────────────

/** Read all documents from a collection. Falls back to localStorage. */
export const dbRead = async <T extends { id: string }>(
  col: string,
  lsKey: string,
): Promise<T[]> => {
  const ref = userCol(col);
  if (!ref) return ls.get<T>(lsKey);
  try {
    const snap = await getDocs(ref);
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
    ls.set(lsKey, docs); // mirror to localStorage
    return docs;
  } catch {
    return ls.get<T>(lsKey); // fallback
  }
};

/** Write (upsert) a single document. Always writes to localStorage too. */
export const dbWrite = async <T extends { id: string }>(
  col: string,
  lsKey: string,
  item: T,
): Promise<void> => {
  // Update localStorage immediately for instant UI
  const current = ls.get<T>(lsKey);
  const exists = current.findIndex(x => (x as { id: string }).id === item.id);
  const next = exists >= 0
    ? current.map(x => (x as { id: string }).id === item.id ? item : x)
    : [item, ...current];
  ls.set(lsKey, next);

  // Firestore async (best-effort)
  const ref = userCol(col);
  if (!ref) return;
  try {
    const { id, ...rest } = item;
    await setDoc(doc(ref, id), rest);
  } catch { /* already saved to localStorage */ }
};

/** Write an entire array atomically to localStorage, and batch to Firestore. */
export const dbWriteAll = async <T extends { id: string }>(
  col: string,
  lsKey: string,
  items: T[],
): Promise<void> => {
  ls.set(lsKey, items);

  const ref = userCol(col);
  if (!ref) return;

  // Simple sequential writes — for small collections this is fine
  try {
    // Delete docs no longer in the list
    const snap = await getDocs(ref);
    const currentIds = new Set(items.map(i => i.id));
    await Promise.all(
      snap.docs
        .filter(d => !currentIds.has(d.id))
        .map(d => deleteDoc(d.ref))
    );
    // Upsert all current items
    await Promise.all(items.map(item => {
      const { id, ...rest } = item;
      return setDoc(doc(ref, id), rest);
    }));
  } catch { /* localStorage already updated */ }
};

/** Delete a single document by id. */
export const dbDelete = async (
  col: string,
  lsKey: string,
  id: string,
): Promise<void> => {
  const current = ls.get<{ id: string }>(lsKey);
  ls.set(lsKey, current.filter(x => x.id !== id));

  const ref = userCol(col);
  if (!ref) return;
  try {
    await deleteDoc(doc(ref, id));
  } catch { /* localStorage already updated */ }
};

/** Subscribe to real-time updates for a collection. Returns unsubscribe fn. */
export const dbSubscribe = <T extends { id: string }>(
  col: string,
  lsKey: string,
  onData: (docs: T[]) => void,
): Unsubscribe => {
  const ref = userCol(col);
  if (!ref) {
    // No Firestore — return no-op unsubscribe
    onData(ls.get<T>(lsKey));
    return () => {};
  }
  return onSnapshot(ref, snap => {
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
    ls.set(lsKey, docs);
    onData(docs);
  }, () => {
    // Error — fall back to localStorage
    onData(ls.get<T>(lsKey));
  });
};

// ── Named collection constants ─────────────────────────────────────────────

export const COLLECTIONS = {
  projects:     { col: 'projects',     ls: 'struccalc.projects.v3' },
  observations: { col: 'observations', ls: 'struccalc.observations.v1' },
  siteVisits:   { col: 'sitevisits',   ls: 'struccalc.sitevisits.v1' },
  photos:       { col: 'photos',       ls: 'struccalc.photos.v1' },
  library:      { col: 'library',      ls: 'struccalc.library.v1' },
  reports:      { col: 'reports',      ls: 'struccalc.reports.v1' },
} as const;
