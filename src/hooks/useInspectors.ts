import { useState, useEffect } from 'react';
import type { Inspector } from '@/types';
import { getActiveInspectors, getAdminInspectors } from '@/services/inspectorService';

interface UseInspectorsResult {
  inspectors: Inspector[];
  adminInspectors: Inspector[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useInspectors(): UseInspectorsResult {
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [adminInspectors, setAdminInspectors] = useState<Inspector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInspectors = async () => {
    try {
      setLoading(true);
      setError(null);
      const [allInspectors, admins] = await Promise.all([
        getActiveInspectors(),
        getAdminInspectors()
      ]);
      setInspectors(allInspectors);
      setAdminInspectors(admins);
    } catch (err) {
      console.error('Error fetching inspectors:', err);
      setError('Failed to load inspectors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspectors();
  }, []);

  return {
    inspectors,
    adminInspectors,
    loading,
    error,
    refetch: fetchInspectors,
  };
}
