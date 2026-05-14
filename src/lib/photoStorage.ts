/**
 * Photo storage helpers — compress images client-side and upload to Firebase
 * Storage. Falls back to base64 in localStorage when Storage is unavailable.
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from '../firebase';

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

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

/**
 * Upload a compressed photo. Returns a URL — either a Storage download URL
 * (when available) or a base64 data URL (offline fallback).
 */
export const uploadPhoto = async (file: File, photoId: string): Promise<string> => {
  const blob = await compressImage(file);
  const uid = auth?.currentUser?.uid;
  if (storage && uid) {
    try {
      const path = `users/${uid}/photos/${photoId}.jpg`;
      const r = ref(storage, path);
      await uploadBytes(r, blob, { contentType: 'image/jpeg' });
      return await getDownloadURL(r);
    } catch {
      return await blobToDataUrl(blob); // fallback
    }
  }
  return await blobToDataUrl(blob);
};

/** Delete a photo from Firebase Storage. No-op for legacy base64 photos. */
export const deletePhotoFile = async (photoId: string, url: string): Promise<void> => {
  if (url.startsWith('data:')) return; // legacy base64 — nothing to delete
  const uid = auth?.currentUser?.uid;
  if (!storage || !uid) return;
  try {
    await deleteObject(ref(storage, `users/${uid}/photos/${photoId}.jpg`));
  } catch { /* best-effort */ }
};
