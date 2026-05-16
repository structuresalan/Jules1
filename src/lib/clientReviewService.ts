import {
  collection, doc, getDoc, getDocs, setDoc, onSnapshot,
  query, orderBy, type Unsubscribe,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface ClientReview {
  id: string;
  projectId: string;
  projectName: string;
  projectNumber: string;
  projectDescription: string;
  clientEmail: string;
  clientName?: string;
  token: string;
  sharedByUid: string;
  sharedByEmail: string;
  firmName?: string;
  status: 'active' | 'closed';
  createdAt: string;
}

export type CommentStatus = 'pending' | 'addressed' | 'approved' | 'denied';

export interface ClientComment {
  id: string;
  reviewId: string;
  text: string;
  authorEmail: string;
  authorName: string;
  createdAt: string;
  status: CommentStatus;
  engineerResponse?: string;
  respondedAt?: string;
}

const makeToken = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

export const createClientReview = async (
  project: { id: string; name: string; projectNumber: string; description: string },
  clientEmail: string,
  clientName: string,
  firmName?: string,
): Promise<ClientReview> => {
  if (!db || !auth?.currentUser) throw new Error('Not signed in');
  const uid = auth.currentUser.uid;
  const id = `rev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const review: ClientReview = {
    id,
    projectId: project.id,
    projectName: project.name,
    projectNumber: project.projectNumber,
    projectDescription: project.description,
    clientEmail: clientEmail.trim().toLowerCase(),
    clientName: clientName.trim() || undefined,
    token: makeToken(),
    sharedByUid: uid,
    sharedByEmail: auth.currentUser.email?.toLowerCase() ?? '',
    firmName,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'clientReviews', id), review);
  return review;
};

export const getReviewByToken = async (reviewId: string, token: string): Promise<ClientReview | null> => {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'clientReviews', reviewId));
    if (!snap.exists()) return null;
    const review = { id: snap.id, ...snap.data() } as ClientReview;
    return review.token === token ? review : null;
  } catch { return null; }
};

export const subscribeProjectReviews = (
  projectId: string,
  onData: (reviews: ClientReview[]) => void,
): Unsubscribe => {
  if (!db) { onData([]); return () => {}; }
  return onSnapshot(
    query(collection(db, 'clientReviews')),
    snap => {
      const reviews = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as ClientReview))
        .filter(r => r.projectId === projectId && r.status === 'active');
      onData(reviews);
    },
    () => onData([]),
  );
};

export const closeReview = async (reviewId: string): Promise<void> => {
  if (!db) return;
  try { await setDoc(doc(db, 'clientReviews', reviewId), { status: 'closed' }, { merge: true }); } catch { /* ok */ }
};

// ── Comments ─────────────────────────────────────────────────────────────────

export const addComment = async (
  reviewId: string,
  text: string,
  authorName: string,
  authorEmail: string,
): Promise<void> => {
  if (!db) throw new Error('Not available');
  const id = `cmt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const comment: ClientComment = {
    id, reviewId, text: text.trim(), authorName, authorEmail,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  await setDoc(doc(db, 'clientReviews', reviewId, 'comments', id), comment);
};

export const subscribeComments = (
  reviewId: string,
  onData: (comments: ClientComment[]) => void,
): Unsubscribe => {
  if (!db) { onData([]); return () => {}; }
  return onSnapshot(
    query(collection(db, 'clientReviews', reviewId, 'comments'), orderBy('createdAt', 'asc')),
    snap => onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as ClientComment))),
    () => onData([]),
  );
};

export const getComments = async (reviewId: string): Promise<ClientComment[]> => {
  if (!db) return [];
  try {
    const snap = await getDocs(query(collection(db, 'clientReviews', reviewId, 'comments'), orderBy('createdAt', 'asc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ClientComment));
  } catch { return []; }
};

export const respondToComment = async (
  reviewId: string,
  commentId: string,
  status: CommentStatus,
  response?: string,
): Promise<void> => {
  if (!db) return;
  const update: Partial<ClientComment> = { status, respondedAt: new Date().toISOString() };
  if (response?.trim()) update.engineerResponse = response.trim();
  await setDoc(doc(db, 'clientReviews', reviewId, 'comments', commentId), update, { merge: true });
};
