import { useState, useEffect, useCallback } from 'react';
import type { Inspection } from '@/types';
import {
  subscribeToInspection,
  subscribeToInProgressInspections,
  updateChecklistItem,
  updateAdditionalDefects,
  completeInspection,
  markAsGone,
  addSecondInspector,
} from '@/services/inspectionService';
import { useConnection } from '@/contexts/ConnectionContext';

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

    const unsubscribe = subscribeToInspection(inspectionId, (data) => {
      setInspection(data);
      setLoading(false);
    });

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
    );

    return () => unsubscribe();
  }, []);

  return {
    inspections,
    loading,
    error,
  };
}
