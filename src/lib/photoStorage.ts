/**
 * Photo storage helpers — compress images client-side and upload to Firebase
 * Storage. Falls back to base64 in localStorage when Storage is unavailable.
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from '../firebase';
import { checkUploadAllowed, recordUpload, recordDelete } from './userProfile';

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;
const MAX_SOURCE_BYTES = 50 * 1024 * 1024;

export class QuotaError extends Error {
  constructor(message: string) { super(message); this.name = 'QuotaError'; }
}

/**
 * Compress an image file: resize to max 1600px on the longest side, convert
 * to JPEG at 0.85 quality. Returns a Blob, typically ~200–400 KB even for
 * large source photos.
 */
export const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result as string; };
    reader.onerror = reject;
    reader.readAsDataURL(file);

    img.onload = () => {
      const { width, height } = img;
      const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
      const w = Math.round(width * scale);
      const h = Math.round(height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas 2D unavailable')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Compression failed')),
        'image/jpeg',
        JPEG_QUALITY,
      );
    };
    img.onerror = () => reject(new Error('Image decode failed'));
  });
};

/** Convert a Blob to a base64 data URL (used as fallback). */
const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

export interface UploadResult {
  url: string;
  bytes: number;
}

/**
 * Upload a compressed photo. Returns the URL and the compressed size in bytes.
 * Throws QuotaError if the user's tier limit would be exceeded.
 */
export const uploadPhoto = async (file: File, photoId: string): Promise<UploadResult> => {
  if (file.size > MAX_SOURCE_BYTES) {
    throw new QuotaError('Source file too large (max 50 MB)');
  }
  const blob = await compressImage(file);
  const precheck = await checkUploadAllowed(blob.size);
  if (!precheck.allowed) throw new QuotaError(precheck.reason ?? 'Upload blocked');

  const uid = auth?.currentUser?.uid;
  let url: string;
  if (storage && uid) {
    try {
      const path = `users/${uid}/photos/${photoId}.jpg`;
      const r = ref(storage, path);
      await uploadBytes(r, blob, { contentType: 'image/jpeg' });
      url = await getDownloadURL(r);
    } catch {
      url = await blobToDataUrl(blob);
    }
  } else {
    url = await blobToDataUrl(blob);
  }
  await recordUpload(blob.size);
  return { url, bytes: blob.size };
};

/** Delete a photo from Firebase Storage and decrement quota counters. */
export const deletePhotoFile = async (photoId: string, url: string, bytes: number): Promise<void> => {
  await recordDelete(bytes);
  if (url.startsWith('data:')) return;
  const uid = auth?.currentUser?.uid;
  if (!storage || !uid) return;
  try {
    await deleteObject(ref(storage, `users/${uid}/photos/${photoId}.jpg`));
  } catch { /* best-effort */ }
};
