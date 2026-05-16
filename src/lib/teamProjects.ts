import {
  collectionGroup, onSnapshot, query, where, type Unsubscribe,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

/**
 * Subscribe to projects shared by all members of a company.
 * Uses a Firestore collectionGroup query across all users' `projects` subcollections,
 * filtered by `companyId`. Skips projects owned by the current user (they already
 * appear from the per-user subscription).
 */
export interface SharedProject {
  id: string;
  ownerUid: string;
  ownerEmail?: string;
  companyId: string;
  name: string;
  projectNumber: string;
  client: string;
  location: string;
  description: string;
  status: string;
  projectType: string;
  createdAt: string;
  updatedAt: string;
  predictedEndDate?: string;
  colorIndex?: number;
}

export const subscribeTeamProjects = (
  companyId: string,
  onData: (projects: SharedProject[]) => void,
): Unsubscribe => {
  if (!db) { onData([]); return () => {}; }
  const myUid = auth?.currentUser?.uid ?? '';
  const q = query(collectionGroup(db, 'projects'), where('companyId', '==', companyId));
  return onSnapshot(
    q,
    snap => {
      const items = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as SharedProject))
        .filter(p => p.ownerUid && p.ownerUid !== myUid);
      onData(items);
    },
    () => onData([]),
  );
};
