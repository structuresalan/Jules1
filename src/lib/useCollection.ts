import { useEffect, useState } from 'react';
import { dbSubscribe, dbWrite, dbDelete, dbWriteAll } from './db';

const lsRead = <T,>(key: string): T[] => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch { return []; }
};

/**
 * Subscribe to a Firestore collection with localStorage fallback/cache.
 *
 * - Initial render uses localStorage cache (instant)
 * - Subscribes to Firestore for live updates from other devices
 * - All writes mirror to both Firestore and localStorage
 *
 * Returns: { items, save, saveAll, remove, refresh }
 */
export function useCollection<T extends { id: string }>(
  col: string,
  lsKey: string,
) {
  const [items, setItems] = useState<T[]>(() => lsRead<T>(lsKey));

  useEffect(() => {
    const unsub = dbSubscribe<T>(col, lsKey, setItems);
    return unsub;
  }, [col, lsKey]);

  const save = (item: T) => {
    setItems(prev => {
      const exists = prev.findIndex(p => p.id === item.id);
      return exists >= 0 ? prev.map(p => p.id === item.id ? item : p) : [item, ...prev];
    });
    void dbWrite(col, lsKey, item);
  };

  const saveAll = (next: T[]) => {
    setItems(next);
    void dbWriteAll(col, lsKey, next);
  };

  const remove = (id: string) => {
    setItems(prev => prev.filter(p => p.id !== id));
    void dbDelete(col, lsKey, id);
  };

  return { items, save, saveAll, remove };
}
