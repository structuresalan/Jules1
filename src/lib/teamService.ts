import { collection, doc, setDoc, deleteDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { auth, db } from '../firebase';

export type TeamRole = 'owner' | 'admin' | 'member';
export type TeamStatus = 'active' | 'pending';

export interface TeamMember {
  id: string;
  email: string;
  role: TeamRole;
  status: TeamStatus;
  addedAt: string;
}

const teamCol = () => {
  const uid = auth?.currentUser?.uid;
  if (!db || !uid) return null;
  return collection(db, 'users', uid, 'team');
};

const LS_KEY = 'struccalc.team.v1';

const lsGet = (): TeamMember[] => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
};
const lsSet = (m: TeamMember[]) => localStorage.setItem(LS_KEY, JSON.stringify(m));

export const subscribeTeam = (onData: (members: TeamMember[]) => void): Unsubscribe => {
  const ref = teamCol();
  onData(lsGet());
  if (!ref) return () => {};
  return onSnapshot(ref, snap => {
    const members = snap.docs.map(d => ({ id: d.id, ...d.data() } as TeamMember));
    lsSet(members);
    onData(members);
  }, () => onData(lsGet()));
};

export const inviteMember = async (email: string, role: TeamRole = 'member'): Promise<void> => {
  const uid = auth?.currentUser?.uid;
  if (!uid) return;
  const id = `member_${Date.now().toString(36)}`;
  const member: TeamMember = { id, email: email.trim().toLowerCase(), role, status: 'pending', addedAt: new Date().toISOString() };
  const current = lsGet();
  lsSet([...current, member]);
  const ref = teamCol();
  if (!ref) return;
  try { await setDoc(doc(ref, id), member); } catch { /* offline ok */ }
};

export const removeMember = async (id: string): Promise<void> => {
  lsSet(lsGet().filter(m => m.id !== id));
  const ref = teamCol();
  if (!ref) return;
  try { await deleteDoc(doc(ref, id)); } catch { /* offline ok */ }
};

export const updateMemberRole = async (id: string, role: TeamRole): Promise<void> => {
  const current = lsGet();
  const updated = current.map(m => m.id === id ? { ...m, role } : m);
  lsSet(updated);
  const ref = teamCol();
  if (!ref) return;
  try {
    const member = updated.find(m => m.id === id);
    if (member) await setDoc(doc(ref, id), member);
  } catch { /* offline ok */ }
};
