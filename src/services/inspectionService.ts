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

// Input validation constants
const MAX_TRUCK_NUMBER_LENGTH = 50;
const MAX_INSPECTOR_NAME_LENGTH = 100;
const MAX_COMMENT_LENGTH = 1000;
const MAX_DEFECTS_LENGTH = 5000;

// Validate and sanitize truck number
function sanitizeTruckNumber(truckNumber: string): string {
  const sanitized = truckNumber.trim().toUpperCase();
  if (!sanitized || sanitized.length > MAX_TRUCK_NUMBER_LENGTH) {
    throw new Error('Invalid truck number');
  }
  // Only allow alphanumeric characters, dashes, and spaces
  if (!/^[A-Z0-9\-\s]+$/.test(sanitized)) {
    throw new Error('Truck number contains invalid characters');
  }
  return sanitized;
}

// Validate inspector name
function validateInspectorName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > MAX_INSPECTOR_NAME_LENGTH) {
    throw new Error('Invalid inspector name');
  }
  return trimmed;
}

// Validate comment text
function sanitizeComment(comment: string): string {
  const trimmed = comment.trim();
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    throw new Error('Comment is too long');
  }
  return trimmed;
}

// Validate defects text
function sanitizeDefects(defects: string): string {
  const trimmed = defects.trim();
  if (trimmed.length > MAX_DEFECTS_LENGTH) {
    throw new Error('Defects text is too long');
  }
  return trimmed;
}

// Create a new inspection
export async function createInspection(
  truckNumber: string,
  inspectorName: string
): Promise<string> {
  const sanitizedTruckNumber = sanitizeTruckNumber(truckNumber);
  const validatedInspectorName = validateInspectorName(inspectorName);
  
  const inspectionData = createNewInspection(sanitizedTruckNumber, validatedInspectorName);
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

// Check if there's already an in-progress inspection for this truck
export async function findInProgressInspectionByTruck(
  truckNumber: string
): Promise<Inspection | null> {
  const sanitizedTruckNumber = sanitizeTruckNumber(truckNumber);
  
  const q = query(
    collection(db, COLLECTION_NAME),
    where('truckNumber', '==', sanitizedTruckNumber),
    where('status', '==', 'in-progress')
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }
  
  // Return the first (should only be one) in-progress inspection
  const docSnap = snapshot.docs[0];
  return {
    id: docSnap.id,
    ...docSnap.data()
  } as Inspection;
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
  callback: (inspections: Inspection[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('status', '==', 'in-progress'),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(
    q,
    (snapshot) => {
      const inspections = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Inspection));
      callback(inspections);
    },
    (error) => {
      console.error('Error subscribing to inspections:', error);
      if (onError) {
        onError(error);
      }
    }
  );
}

// Subscribe to a single inspection (real-time)
export function subscribeToInspection(
  id: string,
  callback: (inspection: Inspection | null) => void,
  onError?: (error: Error) => void
): () => void {
  const docRef = doc(db, COLLECTION_NAME, id);
  
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback({
          id: docSnap.id,
          ...docSnap.data()
        } as Inspection);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error subscribing to inspection:', error);
      if (onError) {
        onError(error);
      }
    }
  );
}

// Update a checklist item
export async function updateChecklistItem(
  inspectionId: string,
  section: 'interior' | 'exterior',
  itemId: string,
  data: Partial<ChecklistItemData>,
  inspectorName: string
): Promise<void> {
  // Validate inputs
  const validatedInspectorName = validateInspectorName(inspectorName);
  
  // Only sanitize comment if it's provided
  const sanitizedComment = data.comment ? sanitizeComment(data.comment) : '';
  
  // Validate itemId - must be camelCase identifier (letters only for this app's schema)
  if (!itemId || !/^[a-zA-Z]+$/.test(itemId)) {
    throw new Error('Invalid item ID');
  }
  
  const docRef = doc(db, COLLECTION_NAME, inspectionId);
  const now = Timestamp.now();
  
  await updateDoc(docRef, {
    [`${section}.${itemId}.value`]: data.value ?? null,
    [`${section}.${itemId}.comment`]: sanitizedComment,
    [`${section}.${itemId}.answeredBy`]: validatedInspectorName,
    [`${section}.${itemId}.answeredAt`]: now,
    updatedAt: now,
  });
}

// Update additional defects
export async function updateAdditionalDefects(
  inspectionId: string,
  defects: string
): Promise<void> {
  const sanitizedDefects = sanitizeDefects(defects);
  
  const docRef = doc(db, COLLECTION_NAME, inspectionId);
  await updateDoc(docRef, {
    additionalDefects: sanitizedDefects,
    updatedAt: Timestamp.now(),
  });
}

// Add second inspector to inspection
export async function addSecondInspector(
  inspectionId: string,
  inspectorName: string
): Promise<void> {
  const validatedInspectorName = validateInspectorName(inspectorName);
  
  const docRef = doc(db, COLLECTION_NAME, inspectionId);
  await updateDoc(docRef, {
    inspector2: validatedInspectorName,
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

// Get all inspections for admin dashboard
export async function getAllInspections(): Promise<Inspection[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Inspection));
}

// Subscribe to all inspections (real-time)
export function subscribeToAllInspections(
  callback: (inspections: Inspection[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(
    q,
    (snapshot) => {
      const inspections = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Inspection));
      callback(inspections);
    },
    (error) => {
      console.error('Error subscribing to inspections:', error);
      if (onError) onError(error);
    }
  );
}
