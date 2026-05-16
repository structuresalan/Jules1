import {
  collectionGroup, onSnapshot, query, where, type Unsubscribe,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

/**
 * Subscribe to projects shared by all members of a company.
 * Uses a Firestore collectionGroup query across all users' `projects` subcollections,
 * filtered by `companyId`. Skips projects owned by the current user (they already
 * appear from the per-user subscription).
 *
 * A project is "shared with the team" when `visibility === 'team'` OR when the
 * `visibility` field is missing (legacy projects default to team-visible).
 */
export interface SharedProject {
  id: string;
  ownerUid: string;
  ownerEmail?: string;
  companyId: string;
  visibility?: 'private' | 'team';
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

const isTeamVisible = (p: { visibility?: string }) => p.visibility !== 'private';

/** All team-visible projects from other company members (excludes current user's own). */
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
        .filter(p => p.ownerUid && p.ownerUid !== myUid && isTeamVisible(p));
      onData(items);
    },
    () => onData([]),
  );
};

/** All team-visible projects in a company including current user's own (used by Company page). */
export const subscribeAllCompanyProjects = (
  companyId: string,
  onData: (projects: SharedProject[]) => void,
): Unsubscribe => {
  if (!db) { onData([]); return () => {}; }
  const q = query(collectionGroup(db, 'projects'), where('companyId', '==', companyId));
  return onSnapshot(
    q,
    snap => {
      const items = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as SharedProject))
        .filter(p => p.ownerUid && isTeamVisible(p));
      onData(items);
    },
    () => onData([]),
  );
};

