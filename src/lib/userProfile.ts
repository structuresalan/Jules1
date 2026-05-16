/**
 * User profile + storage quota tracking.
 *
 * Stored as a single Firestore doc: users/{uid}/profile/main
 * Mirrored to localStorage for offline reads.
 */

import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { auth, db } from '../firebase';

export type Tier = 'starter' | 'pro' | 'business';

export interface UserProfile {
  tier: Tier;
  storageUsedBytes: number;
  photoCount: number;
  uploadsToday: number;
  uploadsResetAt: string;
  promoActive?: boolean;
  displayName?: string;
  company?: string;
  discipline?: string;
  companyId?: string;
  companyRole?: 'owner' | 'manager' | 'employee';
  company?: string;
  discipline?: string;
}

export interface TierLimits {
  bytes: number;
  photoCount: number;
  uploadsPerDay: number;
  maxFileBytes: number;
}

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  starter:  { bytes: 1  * 1024 ** 3, photoCount: 500,   uploadsPerDay: 50,   maxFileBytes: 5 * 1024 ** 2 },
  pro:      { bytes: 5  * 1024 ** 3, photoCount: 2500,  uploadsPerDay: 200,  maxFileBytes: 5 * 1024 ** 2 },
  business: { bytes: 20 * 1024 ** 3, photoCount: 10000, uploadsPerDay: 1000, maxFileBytes: 5 * 1024 ** 2 },
};

const LS_KEY = 'struccalc.userProfile.v1';

const nextMidnightIso = () => {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.toISOString();
};

const defaultProfile = (): UserProfile => ({
  tier: 'starter',
  storageUsedBytes: 0,
  photoCount: 0,
  uploadsToday: 0,
  uploadsResetAt: nextMidnightIso(),
  promoActive: false,
});

const lsRead = (): UserProfile => {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return defaultProfile();
    return { ...defaultProfile(), ...JSON.parse(raw) };
  } catch { return defaultProfile(); }
};

const lsWrite = (p: UserProfile) => {
  window.localStorage.setItem(LS_KEY, JSON.stringify(p));
};

const profileRef = () => {
  const uid = auth?.currentUser?.uid;
  if (!db || !uid) return null;
  return doc(db, 'users', uid, 'profile', 'main');
};

/** Reset daily counter if past midnight. Returns a (possibly updated) profile. */
const rolloverIfNeeded = (p: UserProfile): UserProfile => {
  if (new Date(p.uploadsResetAt).getTime() <= Date.now()) {
    return { ...p, uploadsToday: 0, uploadsResetAt: nextMidnightIso() };
  }
  return p;
};

/** Read profile from Firestore (falls back to localStorage). */
export const getProfile = async (): Promise<UserProfile> => {
  const ref = profileRef();
  if (!ref) return rolloverIfNeeded(lsRead());
  try {
    const snap = await getDoc(ref);
    const data = snap.exists() ? { ...defaultProfile(), ...(snap.data() as Partial<UserProfile>) } : defaultProfile();
    const rolled = rolloverIfNeeded(data);
    lsWrite(rolled);
    return rolled;
  } catch {
    return rolloverIfNeeded(lsRead());
  }
};

/** Write profile to Firestore + localStorage. */
const writeProfile = async (p: UserProfile): Promise<void> => {
  lsWrite(p);
  const ref = profileRef();
  if (!ref) return;
  try { await setDoc(ref, p); } catch { /* offline ok */ }
};

export const getEffectiveLimits = (p: UserProfile): TierLimits => {
  if (p.promoActive) {
    return { bytes: 100 * 1024 ** 3, photoCount: 999999, uploadsPerDay: 99999, maxFileBytes: 50 * 1024 ** 2 };
  }
  return TIER_LIMITS[p.tier];
};

export interface UploadCheck {
  allowed: boolean;
  reason?: string;
}

/** Check whether an upload of `fileBytes` is allowed against the user's quota. */
export const checkUploadAllowed = async (fileBytes: number): Promise<UploadCheck> => {
  const p = rolloverIfNeeded(await getProfile());
  const limits = getEffectiveLimits(p);

  if (fileBytes > limits.maxFileBytes) {
    const mb = Math.round(limits.maxFileBytes / 1024 ** 2);
    return { allowed: false, reason: `File exceeds ${mb} MB per-photo limit` };
  }
  if (p.storageUsedBytes + fileBytes > limits.bytes) {
    return { allowed: false, reason: `Storage full (${formatBytes(p.storageUsedBytes)} of ${formatBytes(limits.bytes)}). Upgrade your plan.` };
  }
  if (p.photoCount >= limits.photoCount) {
    return { allowed: false, reason: `Photo limit reached (${limits.photoCount.toLocaleString()}). Upgrade your plan.` };
  }
  if (p.uploadsToday >= limits.uploadsPerDay) {
    return { allowed: false, reason: `Daily upload limit reached (${limits.uploadsPerDay}). Try again tomorrow.` };
  }
  return { allowed: true };
};

/** Increment counters after a successful upload. */
export const recordUpload = async (fileBytes: number): Promise<void> => {
  const p = rolloverIfNeeded(await getProfile());
  await writeProfile({
    ...p,
    storageUsedBytes: p.storageUsedBytes + fileBytes,
    photoCount: p.photoCount + 1,
    uploadsToday: p.uploadsToday + 1,
  });
};

/** Decrement counters after a successful delete. */
export const recordDelete = async (fileBytes: number): Promise<void> => {
  const p = await getProfile();
  await writeProfile({
    ...p,
    storageUsedBytes: Math.max(0, p.storageUsedBytes - fileBytes),
    photoCount: Math.max(0, p.photoCount - 1),
  });
};

/** Subscribe to live profile changes. */
export const subscribeProfile = (onData: (p: UserProfile) => void): Unsubscribe => {
  const ref = profileRef();
  onData(rolloverIfNeeded(lsRead()));
  if (!ref) return () => {};
  return onSnapshot(ref, snap => {
    const data = snap.exists() ? { ...defaultProfile(), ...(snap.data() as Partial<UserProfile>) } : defaultProfile();
    const rolled = rolloverIfNeeded(data);
    lsWrite(rolled);
    onData(rolled);
  }, () => { onData(rolloverIfNeeded(lsRead())); });
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
};

export const initUserProfile = async (tier: Tier, extra?: { displayName?: string; company?: string; discipline?: string }): Promise<void> => {
  // Wait for auth.currentUser to be set (up to 3 seconds)
  for (let i = 0; i < 30; i++) {
    if (auth?.currentUser) break;
    await new Promise(r => setTimeout(r, 100));
  }
  const p: UserProfile = { ...defaultProfile(), tier, ...extra };
  lsWrite(p);
  const ref = profileRef();
  if (!ref) return;
  try { await setDoc(ref, p); } catch { /* offline ok */ }
};

export const updateAccountInfo = async (fields: { displayName?: string; company?: string; discipline?: string }): Promise<void> => {
  const p = await getProfile();
  await writeProfile({ ...p, ...fields });
};

export const updateCompanyInfo = async (companyId: string, companyRole: 'owner' | 'manager' | 'employee'): Promise<void> => {
  const p = await getProfile();
  await writeProfile({ ...p, companyId, companyRole });
};

export const redeemPromoCode = async (code: string): Promise<{ success: boolean; message: string }> => {
  const validCode = String(import.meta.env.VITE_PROMO_CODE || '').trim();
  if (!validCode) return { success: false, message: 'No promo codes are active.' };
  if (code.trim() !== validCode) return { success: false, message: 'Invalid code.' };
  const p = await getProfile();
  if (p.promoActive) return { success: false, message: 'Code already redeemed.' };
  await writeProfile({ ...p, promoActive: true });
  return { success: true, message: 'Code accepted — all limits removed.' };
};
