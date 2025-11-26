import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { EmailRecipient } from '@/types';

const COLLECTION_NAME = 'emailRecipients';
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254; // RFC 5321 limit

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Get all email recipients
export async function getEmailRecipients(): Promise<EmailRecipient[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy('name')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as EmailRecipient));
}

// Subscribe to email recipients (real-time)
export function subscribeToEmailRecipients(
  callback: (recipients: EmailRecipient[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy('name')
  );
  
  return onSnapshot(
    q,
    (snapshot) => {
      const recipients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as EmailRecipient));
      callback(recipients);
    },
    (error) => {
      console.error('Error subscribing to email recipients:', error);
      if (onError) onError(error);
    }
  );
}

// Add a new email recipient
export async function addEmailRecipient(name: string, email: string): Promise<string> {
  // Validate name
  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length > MAX_NAME_LENGTH) {
    throw new Error('Invalid recipient name');
  }
  
  // Validate email
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail || trimmedEmail.length > MAX_EMAIL_LENGTH) {
    throw new Error('Invalid email address');
  }
  
  if (!isValidEmail(trimmedEmail)) {
    throw new Error('Invalid email format');
  }
  
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    name: trimmedName,
    email: trimmedEmail,
    createdAt: now,
    updatedAt: now,
  });
  
  return docRef.id;
}

// Update an email recipient
export async function updateEmailRecipient(
  id: string,
  data: Partial<Pick<EmailRecipient, 'name' | 'email'>>
): Promise<void> {
  const updateData: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
  };
  
  if (data.name !== undefined) {
    const trimmedName = data.name.trim();
    if (!trimmedName || trimmedName.length > MAX_NAME_LENGTH) {
      throw new Error('Invalid recipient name');
    }
    updateData.name = trimmedName;
  }
  
  if (data.email !== undefined) {
    const trimmedEmail = data.email.trim().toLowerCase();
    if (!trimmedEmail || trimmedEmail.length > MAX_EMAIL_LENGTH) {
      throw new Error('Invalid email address');
    }
    if (!isValidEmail(trimmedEmail)) {
      throw new Error('Invalid email format');
    }
    updateData.email = trimmedEmail;
  }
  
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, updateData);
}

// Delete an email recipient
export async function deleteEmailRecipient(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}
