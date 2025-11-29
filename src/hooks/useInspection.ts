import { useState, useEffect, useCallback } from 'react';
import type { Inspection, DefectPhoto } from '@/types';
import {
  subscribeToInspection,
  subscribeToInProgressInspections,
  updateChecklistItem,
  updateChecklistItemPhoto,
  updateAdditionalDefects,
  completeInspection,
  markAsGone,
  addSecondInspector,
  addDefectPhoto,
  removeDefectPhoto,
} from '@/services/inspectionService';
import {
  uploadInspectionPhoto,
  uploadDefectPhoto,
  deleteInspectionPhoto,
} from '@/services/storageService';
import { useConnection } from '@/contexts/ConnectionContext';
import { Timestamp } from 'firebase/firestore';

/**
 * Convert an error to a user-friendly message for photo operations
 * @param err The error to convert
 * @param defaultMessage The default message if no specific error is detected
 * @returns A user-friendly error message
 */
function getPhotoErrorMessage(err: unknown, defaultMessage: string): string {
  if (err instanceof Error) {
    if (err.message.includes('memory') || err.message.includes('Memory')) {
      return 'Photo too large for device memory. Please try again with a smaller image.';
    } else if (err.message.includes('too large')) {
      return err.message;
    } else if (err.message.includes('network') || err.message.includes('Network')) {
      return 'Network error. Please check your connection and try again.';
    }
    return err.message;
  }
  return defaultMessage;
}

interface UseInspectionResult {
  inspection: Inspection | null;
  loading: boolean;
  error: string | null;
  updateItem: (
    section: 'interior' | 'exterior',
    itemId: string,
    value: string,
    inspectorName: string
  ) => Promise<void>;
  updateComment: (
    section: 'interior' | 'exterior',
    itemId: string,
    comment: string,
    inspectorName: string
  ) => Promise<void>;
  updateDefects: (defects: string) => Promise<void>;
  complete: () => Promise<void>;
  gone: () => Promise<void>;
  joinAsSecondInspector: (inspectorName: string) => Promise<void>;
  captureItemPhoto: (
    section: 'interior' | 'exterior',
    itemId: string,
    file: File,
    inspectorName: string
  ) => Promise<void>;
  deleteItemPhoto: (
    section: 'interior' | 'exterior',
    itemId: string,
    inspectorName: string
  ) => Promise<void>;
  addDefectPhotoToInspection: (
    file: File,
    caption: string | undefined,
    inspectorName: string
  ) => Promise<void>;
  removeDefectPhotoFromInspection: (photoUrl: string) => Promise<void>;
}

export function useInspection(inspectionId: string | null): UseInspectionResult {
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(!!inspectionId);
  const [error, setError] = useState<string | null>(null);
  const { setStatus } = useConnection();

  useEffect(() => {
    if (!inspectionId) {
      return;
    }

    const unsubscribe = subscribeToInspection(
      inspectionId,
      (data) => {
        setInspection(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Subscription error:', err);
        setError('Failed to load inspection');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [inspectionId]);

  const updateItem = useCallback(
    async (
      section: 'interior' | 'exterior',
      itemId: string,
      value: string,
      inspectorName: string
    ) => {
      if (!inspectionId) return;
      try {
        setStatus('syncing');
        await updateChecklistItem(inspectionId, section, itemId, { value }, inspectorName);
        setStatus('online');
      } catch (err) {
        console.error('Error updating item:', err);
        setError('Failed to update item');
        setStatus('offline');
      }
    },
    [inspectionId, setStatus]
  );

  const updateComment = useCallback(
    async (
      section: 'interior' | 'exterior',
      itemId: string,
      comment: string,
      inspectorName: string
    ) => {
      if (!inspectionId) return;
      try {
        setStatus('syncing');
        await updateChecklistItem(inspectionId, section, itemId, { comment }, inspectorName);
        setStatus('online');
      } catch (err) {
        console.error('Error updating comment:', err);
        setError('Failed to update comment');
        setStatus('offline');
      }
    },
    [inspectionId, setStatus]
  );

  const updateDefects = useCallback(
    async (defects: string) => {
      if (!inspectionId) return;
      try {
        setStatus('syncing');
        await updateAdditionalDefects(inspectionId, defects);
        setStatus('online');
      } catch (err) {
        console.error('Error updating defects:', err);
        setError('Failed to update defects');
        setStatus('offline');
      }
    },
    [inspectionId, setStatus]
  );

  const complete = useCallback(async () => {
    if (!inspectionId) return;
    try {
      setStatus('syncing');
      await completeInspection(inspectionId);
      setStatus('online');
    } catch (err) {
      console.error('Error completing inspection:', err);
      setError('Failed to complete inspection');
      setStatus('offline');
    }
  }, [inspectionId, setStatus]);

  const gone = useCallback(async () => {
    if (!inspectionId) return;
    try {
      setStatus('syncing');
      await markAsGone(inspectionId);
      setStatus('online');
    } catch (err) {
      console.error('Error marking as gone:', err);
      setError('Failed to mark as gone');
      setStatus('offline');
    }
  }, [inspectionId, setStatus]);

  const joinAsSecondInspector = useCallback(
    async (inspectorName: string) => {
      if (!inspectionId) return;
      try {
        setStatus('syncing');
        await addSecondInspector(inspectionId, inspectorName);
        setStatus('online');
      } catch (err) {
        console.error('Error joining inspection:', err);
        setError('Failed to join inspection');
        setStatus('offline');
      }
    },
    [inspectionId, setStatus]
  );

  const captureItemPhoto = useCallback(
    async (
      section: 'interior' | 'exterior',
      itemId: string,
      file: File,
      inspectorName: string
    ) => {
      if (!inspectionId) {
        console.error('[captureItemPhoto] No inspectionId');
        return;
      }

      console.log('[captureItemPhoto] Starting:', { inspectionId, section, itemId, fileName: file.name, fileSize: file.size });

      const maxRetries = 2;
      let lastError: unknown = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          setStatus('syncing');

          // Small delay on first attempt to ensure document is ready
          if (attempt === 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          // Step 1: Upload to storage
          console.log(`[captureItemPhoto] Attempt ${attempt}/${maxRetries} - Step 1: Uploading to storage...`);
          const photoUrl = await uploadInspectionPhoto(inspectionId, itemId, file);
          console.log(`[captureItemPhoto] Attempt ${attempt}/${maxRetries} - Step 1 complete. URL:`, photoUrl);

          // Step 2: Update Firestore
          console.log(`[captureItemPhoto] Attempt ${attempt}/${maxRetries} - Step 2: Updating Firestore...`);
          await updateChecklistItemPhoto(inspectionId, section, itemId, photoUrl, inspectorName);
          console.log(`[captureItemPhoto] Attempt ${attempt}/${maxRetries} - Step 2 complete. Photo saved to Firestore.`);

          setStatus('online');
          return; // Success, exit the function
        } catch (err) {
          lastError = err;
          console.error(`[captureItemPhoto] Attempt ${attempt}/${maxRetries} FAILED:`, err);

          if (attempt < maxRetries) {
            // Wait before retrying (exponential backoff: 500ms, then 1000ms)
            const delay = 500 * attempt;
            console.log(`[captureItemPhoto] Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // All retries failed
      setStatus('offline');
      const userMessage = getPhotoErrorMessage(lastError, 'Failed to capture photo. Please try again.');
      setError(userMessage);
      throw new Error(userMessage);
    },
    [inspectionId, setStatus]
  );

  const deleteItemPhoto = useCallback(
    async (
      section: 'interior' | 'exterior',
      itemId: string,
      inspectorName: string
    ) => {
      if (!inspectionId || !inspection) return;
      try {
        setStatus('syncing');
        // Get current photo URL
        const sectionData = section === 'interior' ? inspection.interior : inspection.exterior;
        const itemData = sectionData[itemId as keyof typeof sectionData] as { photoUrl?: string | null } | undefined;
        const photoUrl = itemData?.photoUrl;
        
        if (photoUrl) {
          // Delete from storage
          await deleteInspectionPhoto(photoUrl);
        }
        // Update inspection document to remove photo reference
        await updateChecklistItemPhoto(inspectionId, section, itemId, null, inspectorName);
        setStatus('online');
      } catch (err) {
        console.error('Error deleting photo:', err);
        setError('Failed to delete photo');
        setStatus('offline');
        throw err;
      }
    },
    [inspectionId, inspection, setStatus]
  );

  const addDefectPhotoToInspection = useCallback(
    async (file: File, caption: string | undefined, inspectorName: string) => {
      if (!inspectionId) {
        console.error('[addDefectPhoto] No inspectionId');
        return;
      }

      console.log('[addDefectPhoto] Starting:', { inspectionId, fileName: file.name, fileSize: file.size, hasCaption: !!caption });

      try {
        setStatus('syncing');

        // Step 1: Upload to storage
        console.log('[addDefectPhoto] Step 1: Uploading to storage...');
        const photoUrl = await uploadDefectPhoto(inspectionId, file);
        console.log('[addDefectPhoto] Step 1 complete. URL:', photoUrl);

        // Step 2: Create photo object and save to Firestore
        console.log('[addDefectPhoto] Step 2: Saving to Firestore...');
        // Only include caption if it has a value to avoid Firestore arrayUnion() error with undefined
        const defectPhoto: DefectPhoto = {
          url: photoUrl,
          ...(caption && caption.trim() ? { caption: caption.trim() } : {}),
          takenBy: inspectorName,
          takenAt: Timestamp.now(),
        };
        console.log('[addDefectPhoto] Photo object created with url:', photoUrl);

        await addDefectPhoto(inspectionId, defectPhoto);
        console.log('[addDefectPhoto] Step 2 complete. Photo saved to Firestore.');

        setStatus('online');
      } catch (err) {
        console.error('[addDefectPhoto] FAILED:', err);
        setStatus('offline');

        const userMessage = getPhotoErrorMessage(err, 'Failed to add defect photo');
        setError(userMessage);
        // Re-throw with user-friendly message so UI can handle it
        throw new Error(userMessage);
      }
    },
    [inspectionId, setStatus]
  );

  const removeDefectPhotoFromInspection = useCallback(
    async (photoUrl: string) => {
      if (!inspectionId) return;
      try {
        setStatus('syncing');
        // Delete from storage
        await deleteInspectionPhoto(photoUrl);
        // Remove from inspection document
        await removeDefectPhoto(inspectionId, photoUrl);
        setStatus('online');
      } catch (err) {
        console.error('Error removing defect photo:', err);
        setError('Failed to remove defect photo');
        setStatus('offline');
        throw err;
      }
    },
    [inspectionId, setStatus]
  );

  return {
    inspection,
    loading,
    error,
    updateItem,
    updateComment,
    updateDefects,
    complete,
    gone,
    joinAsSecondInspector,
    captureItemPhoto,
    deleteItemPhoto,
    addDefectPhotoToInspection,
    removeDefectPhotoFromInspection,
  };
}

// Hook for listing in-progress inspections
interface UseInProgressInspectionsResult {
  inspections: Inspection[];
  loading: boolean;
  error: string | null;
}

export function useInProgressInspections(): UseInProgressInspectionsResult {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToInProgressInspections(
      (data) => {
        setInspections(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Subscription error:', err);
        setError('Failed to load inspections');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    inspections,
    loading,
    error,
  };
}
