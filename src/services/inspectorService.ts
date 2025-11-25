import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Inspector } from '@/types';

const COLLECTION_NAME = 'inspectors';

// Get all active inspectors
export async function getActiveInspectors(): Promise<Inspector[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('active', '==', true),
    orderBy('name')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Inspector));
}

// Get admin inspectors only
export async function getAdminInspectors(): Promise<Inspector[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('active', '==', true),
    where('isAdmin', '==', true),
    orderBy('name')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Inspector));
}

// Get all inspectors (for admin purposes)
export async function getAllInspectors(): Promise<Inspector[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy('name')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Inspector));
}
