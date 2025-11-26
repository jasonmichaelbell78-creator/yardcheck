import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Inspector } from '@/types';

const COLLECTION_NAME = 'inspectors';
export const MAX_ACTIVE_INSPECTORS = 20;
const MAX_NAME_LENGTH = 100;

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

// Subscribe to all inspectors (real-time)
export function subscribeToAllInspectors(
  callback: (inspectors: Inspector[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy('name')
  );
  
  return onSnapshot(
    q,
    (snapshot) => {
      const inspectors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Inspector));
      callback(inspectors);
    },
    (error) => {
      console.error('Error subscribing to inspectors:', error);
      if (onError) onError(error);
    }
  );
}

// Add a new inspector
export async function addInspector(name: string, isAdmin: boolean): Promise<string> {
  // Validate name
  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length > MAX_NAME_LENGTH) {
    throw new Error('Invalid inspector name');
  }
  
  // Check active inspector limit
  const activeInspectors = await getActiveInspectors();
  if (activeInspectors.length >= MAX_ACTIVE_INSPECTORS) {
    throw new Error(`Maximum of ${MAX_ACTIVE_INSPECTORS} active inspectors allowed`);
  }
  
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    name: trimmedName,
    isAdmin,
    active: true,
    createdAt: now,
    updatedAt: now,
  });
  
  return docRef.id;
}

// Deactivate an inspector
export async function deactivateInspector(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    active: false,
    updatedAt: Timestamp.now(),
  });
}

// Reactivate an inspector
export async function reactivateInspector(id: string): Promise<void> {
  // Check active inspector limit before reactivating
  const activeInspectors = await getActiveInspectors();
  if (activeInspectors.length >= MAX_ACTIVE_INSPECTORS) {
    throw new Error(`Maximum of ${MAX_ACTIVE_INSPECTORS} active inspectors allowed`);
  }
  
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    active: true,
    updatedAt: Timestamp.now(),
  });
}

// Update an inspector
export async function updateInspector(id: string, data: Partial<Pick<Inspector, 'name' | 'isAdmin'>>): Promise<void> {
  const updateData: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
  };
  
  if (data.name !== undefined) {
    const trimmedName = data.name.trim();
    if (!trimmedName || trimmedName.length > MAX_NAME_LENGTH) {
      throw new Error('Invalid inspector name');
    }
    updateData.name = trimmedName;
  }
  
  if (data.isAdmin !== undefined) {
    updateData.isAdmin = data.isAdmin;
  }
  
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, updateData);
}
