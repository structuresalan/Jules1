import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc,
  onSnapshot, query, where, type Unsubscribe,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export type CompanyRole = 'owner' | 'manager' | 'employee';

export interface Company {
  id: string;
  name: string;
  description?: string;
  ownerUid: string;
  createdAt: string;
}

export interface CompanyMember {
  id: string;
  uid?: string;
  email: string;
  name?: string;
  role: CompanyRole;
  status: 'active' | 'pending';
  addedAt: string;
}

export interface CompanyInvite {
  id: string;
  companyId: string;
  companyName: string;
  email: string;
  role: CompanyRole;
  invitedByUid: string;
  createdAt: string;
  status: 'pending' | 'accepted';
}

const uid = () => auth?.currentUser?.uid ?? null;
const userEmail = () => auth?.currentUser?.email?.toLowerCase() ?? null;

// ── Company CRUD ────────────────────────────────────────────────────────────

export const createCompany = async (name: string, description?: string): Promise<Company> => {
  const userId = uid();
  if (!db || !userId) throw new Error('Not signed in');
  const id = `co_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const company: Company = { id, name: name.trim(), description, ownerUid: userId, createdAt: new Date().toISOString() };
  await setDoc(doc(db, 'companies', id), company);
  // Add owner as first member
  const ownerId = `mem_${Date.now().toString(36)}`;
  const ownerMember: CompanyMember = {
    id: ownerId, uid: userId,
    email: auth?.currentUser?.email?.toLowerCase() ?? '',
    name: '', role: 'owner', status: 'active',
    addedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'companies', id, 'members', ownerId), ownerMember);
  return company;
};

export const getCompany = async (companyId: string): Promise<Company | null> => {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'companies', companyId));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Company : null;
  } catch { return null; }
};

export const subscribeCompany = (companyId: string, onData: (c: Company | null) => void): Unsubscribe => {
  if (!db) { onData(null); return () => {}; }
  return onSnapshot(doc(db, 'companies', companyId), snap => {
    onData(snap.exists() ? { id: snap.id, ...snap.data() } as Company : null);
  }, () => onData(null));
};

// ── Members ─────────────────────────────────────────────────────────────────

export const subscribeMembers = (companyId: string, onData: (members: CompanyMember[]) => void): Unsubscribe => {
  if (!db) { onData([]); return () => {}; }
  return onSnapshot(collection(db, 'companies', companyId, 'members'), snap => {
    onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as CompanyMember)));
  }, () => onData([]));
};

export const inviteMember = async (companyId: string, companyName: string, email: string, role: 'manager' | 'employee'): Promise<void> => {
  const userId = uid();
  if (!db || !userId) return;
  const normalEmail = email.trim().toLowerCase();
  // Add pending member
  const memberId = `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
  const member: CompanyMember = { id: memberId, email: normalEmail, role, status: 'pending', addedAt: new Date().toISOString() };
  await setDoc(doc(db, 'companies', companyId, 'members', memberId), member);
  // Create invite
  const inviteId = `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
  const invite: CompanyInvite = { id: inviteId, companyId, companyName, email: normalEmail, role, invitedByUid: userId, createdAt: new Date().toISOString(), status: 'pending' };
  await setDoc(doc(db, 'invites', inviteId), invite);
};

export const removeMember = async (companyId: string, memberId: string): Promise<void> => {
  if (!db) return;
  try { await deleteDoc(doc(db, 'companies', companyId, 'members', memberId)); } catch { /* ok */ }
};

export const updateMemberRole = async (companyId: string, memberId: string, role: CompanyRole): Promise<void> => {
  if (!db) return;
  try { await setDoc(doc(db, 'companies', companyId, 'members', memberId), { role }, { merge: true }); } catch { /* ok */ }
};

// ── Invites ──────────────────────────────────────────────────────────────────

export const checkPendingInvite = async (): Promise<CompanyInvite | null> => {
  const email = userEmail();
  if (!db || !email) return null;
  try {
    const q = query(collection(db, 'invites'), where('email', '==', email), where('status', '==', 'pending'));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as CompanyInvite;
  } catch { return null; }
};

export const acceptInvite = async (invite: CompanyInvite): Promise<void> => {
  const userId = uid();
  const email = userEmail();
  if (!db || !userId || !email) return;
  // Mark invite accepted
  await setDoc(doc(db, 'invites', invite.id), { status: 'accepted' }, { merge: true });
  // Find the pending member doc and activate it
  const membersSnap = await getDocs(collection(db, 'companies', invite.companyId, 'members'));
  const pendingDoc = membersSnap.docs.find(d => d.data().email === email && d.data().status === 'pending');
  if (pendingDoc) {
    await setDoc(doc(db, 'companies', invite.companyId, 'members', pendingDoc.id), { uid: userId, status: 'active' }, { merge: true });
  }
};

export const declineInvite = async (inviteId: string): Promise<void> => {
  if (!db) return;
  try { await setDoc(doc(db, 'invites', inviteId), { status: 'accepted' }, { merge: true }); } catch { /* ok */ }
};
