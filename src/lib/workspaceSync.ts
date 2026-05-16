/**
 * VisualWorkspace persistence — Firestore sync with localStorage cache.
 *
 * VisualWorkspace stores three big project-scoped blobs:
 *   - markups (boardId -> Markup[])
 *   - graphs  (boardId -> RelationshipGraph)
 *   - docs    (AttachedDoc[])
 *
 * Each lives at users/{uid}/workspace_{kind}/{projectId} with a single field
 * `data` holding the blob. We mirror to localStorage for instant reload and
 * offline support.
 */
import {
  doc, getDoc, onSnapshot, setDoc, type Unsubscribe,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

type WorkspaceKind = 'workspace_markups' | 'workspace_graphs' | 'workspace_docs';

const lsKey = (kind: WorkspaceKind, projectId: string) => `vw.${kind}.${projectId || 'default'}`;

const docRef = (kind: WorkspaceKind, projectId: string) => {
  const uid = auth?.currentUser?.uid;
  if (!db || !uid || !projectId) return null;
  return doc(db, 'users', uid, kind, projectId);
};

const readLs = <T>(kind: WorkspaceKind, projectId: string): T | null => {
  try {
    const raw = localStorage.getItem(lsKey(kind, projectId));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
};

const writeLs = <T>(kind: WorkspaceKind, projectId: string, data: T) => {
  try { localStorage.setItem(lsKey(kind, projectId), JSON.stringify(data)); } catch { /* storage full */ }
};

/** Subscribe to a workspace blob. Calls onData with the cached LS value first
 *  (synchronously, so initial render isn't blank), then with live Firestore
 *  updates. Returns an unsubscribe function. */
export function subscribeWorkspace<T>(
  kind: WorkspaceKind,
  projectId: string,
  onData: (data: T | null) => void,
): Unsubscribe {
  // Instant: hydrate from localStorage cache.
  const cached = readLs<T>(kind, projectId);
  if (cached !== null) onData(cached);

  const ref = docRef(kind, projectId);
  if (!ref) return () => {};
  return onSnapshot(
    ref,
    snap => {
      if (!snap.exists()) return; // keep cached value
      const remote = (snap.data() as { data?: T }).data;
      if (remote === undefined) return;
      writeLs(kind, projectId, remote);
      onData(remote);
    },
    () => { /* keep using cached LS value */ },
  );
}

/** Write a workspace blob. Always updates localStorage; best-effort to Firestore. */
export async function saveWorkspace<T>(
  kind: WorkspaceKind,
  projectId: string,
  data: T,
): Promise<void> {
  writeLs(kind, projectId, data);
  const ref = docRef(kind, projectId);
  if (!ref) return;
  try {
    await setDoc(ref, { data, updatedAt: new Date().toISOString() }, { merge: true });
  } catch { /* localStorage already saved */ }
}

/** One-shot read (used for legacy migration paths if needed). */
export async function readWorkspace<T>(
  kind: WorkspaceKind,
  projectId: string,
): Promise<T | null> {
  const cached = readLs<T>(kind, projectId);
  if (cached !== null) return cached;
  const ref = docRef(kind, projectId);
  if (!ref) return null;
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return (snap.data() as { data?: T }).data ?? null;
  } catch { return null; }
}
