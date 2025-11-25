import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Inspection, ChecklistItemData } from '@/types';
import { createNewInspection } from '@/config/checklist';

const COLLECTION_NAME = 'inspections';

// Create a new inspection
export async function createInspection(
  truckNumber: string,
  inspectorName: string
): Promise<string> {
  const inspectionData = createNewInspection(truckNumber, inspectorName);
  const docRef = await addDoc(collection(db, COLLECTION_NAME), inspectionData);
  return docRef.id;
}

// Get a single inspection by ID
export async function getInspection(id: string): Promise<Inspection | null> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Inspection;
  }
  return null;
}

// Get in-progress inspections
export async function getInProgressInspections(): Promise<Inspection[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('status', '==', 'in-progress'),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Inspection));
}

// Subscribe to in-progress inspections (real-time)
export function subscribeToInProgressInspections(
  callback: (inspections: Inspection[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('status', '==', 'in-progress'),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const inspections = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Inspection));
    callback(inspections);
  });
}

// Subscribe to a single inspection (real-time)
export function subscribeToInspection(
  id: string,
  callback: (inspection: Inspection | null) => void
): () => void {
  const docRef = doc(db, COLLECTION_NAME, id);
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({
        id: docSnap.id,
        ...docSnap.data()
      } as Inspection);
    } else {
      callback(null);
    }
  });
}

// Update a checklist item
export async function updateChecklistItem(
  inspectionId: string,
  section: 'interior' | 'exterior',
  itemId: string,
  data: Partial<ChecklistItemData>,
  inspectorName: string
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, inspectionId);
  const now = Timestamp.now();
  
  await updateDoc(docRef, {
    [`${section}.${itemId}.value`]: data.value ?? null,
    [`${section}.${itemId}.comment`]: data.comment ?? '',
    [`${section}.${itemId}.answeredBy`]: inspectorName,
    [`${section}.${itemId}.answeredAt`]: now,
    updatedAt: now,
  });
}

// Update additional defects
export async function updateAdditionalDefects(
  inspectionId: string,
  defects: string
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, inspectionId);
  await updateDoc(docRef, {
    additionalDefects: defects,
    updatedAt: Timestamp.now(),
  });
}

// Add second inspector to inspection
export async function addSecondInspector(
  inspectionId: string,
  inspectorName: string
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, inspectionId);
  await updateDoc(docRef, {
    inspector2: inspectorName,
    updatedAt: Timestamp.now(),
  });
}

// Mark inspection as complete
export async function completeInspection(inspectionId: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, inspectionId);
  const now = Timestamp.now();
  
  await updateDoc(docRef, {
    status: 'complete',
    completedAt: now,
    updatedAt: now,
  });
}

// Mark inspection as gone (truck left yard)
export async function markAsGone(inspectionId: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, inspectionId);
  const now = Timestamp.now();
  
  await updateDoc(docRef, {
    status: 'gone',
    completedAt: now,
    updatedAt: now,
  });
}
