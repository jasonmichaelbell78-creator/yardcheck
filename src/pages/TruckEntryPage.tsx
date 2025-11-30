import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Truck, Plus, Clock, Users, LogOut, History, Search, Calendar, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { InspectionDetailModal } from '@/components/InspectionDetailModal';
import { useAuth } from '@/contexts/AuthContext';
import { useInProgressInspections } from '@/hooks/useInspection';
import { createInspection, findInProgressInspectionByTruck, addSecondInspector, getInspectorInspections } from '@/services/inspectionService';
import { validateTruckNumber, normalizeTruckNumber, formatTimestamp } from '@/utils/validation';
import type { Inspection } from '@/types';

// Calculate default date range (last 7 days) - outside component to avoid recreation
function getDefaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export function TruckEntryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { inspector, logout } = useAuth();
  const { inspections, loading } = useInProgressInspections();
  const [truckNumber, setTruckNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [joinMessage, setJoinMessage] = useState('');
  
  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [historyInspections, setHistoryInspections] = useState<Inspection[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historyTruckFilter, setHistoryTruckFilter] = useState('');
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Track the inspector name for which history was loaded
  const lastLoadedInspectorRef = useRef<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!inspector) return;
    
    setHistoryLoading(true);
    setHistoryError(null);
    
    try {
      const startDate = historyStartDate ? new Date(historyStartDate) : undefined;
      const endDate = historyEndDate ? new Date(historyEndDate) : undefined;
      
      const results = await getInspectorInspections(
        inspector.name,
        startDate,
        endDate
      );
      setHistoryInspections(results);
    } catch (err) {
      console.error('Error loading history:', err);
      setHistoryError('Failed to load inspection history');
    } finally {
      setHistoryLoading(false);
    }
  }, [inspector, historyStartDate, historyEndDate]);

  // Load history when section is opened for the first time or when inspector changes
  useEffect(() => {
    if (showHistory && inspector) {
      const inspectorName = inspector.name;
      const shouldReload = lastLoadedInspectorRef.current !== inspectorName;
      
      // Set default dates and load on first open or when inspector changes
      const loadInitialHistory = async () => {
        // Set default dates
        const defaults = getDefaultDates();
        setHistoryStartDate(defaults.start);
        setHistoryEndDate(defaults.end);
        
        // Load history with default dates
        setHistoryLoading(true);
        setHistoryError(null);
        
        try {
          const startDate = new Date(defaults.start);
          const endDate = new Date(defaults.end);
          
          const results = await getInspectorInspections(
            inspectorName,
            startDate,
            endDate
          );
          setHistoryInspections(results);
          lastLoadedInspectorRef.current = inspectorName;
        } catch (err) {
          console.error('Error loading history:', err);
          setHistoryError('Failed to load inspection history');
        } finally {
          setHistoryLoading(false);
        }
      };
      
      // Load if we haven't loaded before or if inspector changed
      if ((historyInspections.length === 0 && !historyLoading) || shouldReload) {
        loadInitialHistory();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHistory, inspector?.name]);

  // Refresh history when returning from a completed inspection
  useEffect(() => {
    const state = location.state as { refreshHistory?: boolean } | null;
    if (state?.refreshHistory && inspector) {
      // Auto-expand history section and reload
      setShowHistory(true);
      loadHistory();
      // Clear the state to prevent re-triggering on subsequent renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, inspector, loadHistory, navigate, location.pathname]);

  // Filter history inspections by truck number
  const filteredHistoryInspections = useMemo(() => {
    if (!historyTruckFilter.trim()) return historyInspections;
    const filter = historyTruckFilter.toLowerCase();
    return historyInspections.filter(i => 
      i.truckNumber.toLowerCase().includes(filter)
    );
  }, [historyInspections, historyTruckFilter]);

  const handleApplyHistoryFilters = () => {
    loadHistory();
  };

  const handleViewInspection = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setShowDetailModal(true);
  };

  const handleBeginInspection = async () => {
    if (!inspector) return;
    
    const normalizedTruckNumber = normalizeTruckNumber(truckNumber);
    
    if (!validateTruckNumber(normalizedTruckNumber)) {
      setError('Please enter a valid truck number');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setJoinMessage('');

    try {
      // Check if there's already an in-progress inspection for this truck
      const existingInspection = await findInProgressInspectionByTruck(normalizedTruckNumber);
      
      if (existingInspection) {
        // Join the existing inspection instead of creating a new one
        if (existingInspection.inspector1 !== inspector.name &&
            existingInspection.inspector2 !== inspector.name) {
          await addSecondInspector(existingInspection.id, inspector.name);
        }
        setJoinMessage(`Joining existing inspection for truck #${normalizedTruckNumber}`);
        // Small delay to show the message before navigating
        setTimeout(() => {
          navigate(`/inspection/${existingInspection.id}`);
        }, 500);
        return;
      }
      
      // No existing inspection, create a new one
      const inspectionId = await createInspection(
        normalizedTruckNumber,
        inspector.name
      );
      navigate(`/inspection/${inspectionId}`);
    } catch (err) {
      console.error('Error creating inspection:', err);
      setError('Failed to create inspection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueInspection = (inspectionId: string) => {
    navigate(`/inspection/${inspectionId}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!inspector) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6" />
            <div>
              <h1 className="font-bold">YardCheck</h1>
              <p className="text-sm text-white/80">{inspector.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ConnectionStatus />
            {inspector?.isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin')}
                className="text-white border-white/20 hover:bg-white/10"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-white hover:bg-white/10"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto">
        {/* New Inspection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              New Inspection
            </CardTitle>
            <CardDescription>
              Enter the truck number to begin a new inspection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Truck Number"
                value={truckNumber}
                onChange={(e) => {
                  setTruckNumber(e.target.value);
                  setError('');
                  setJoinMessage('');
                }}
                className="text-lg"
                disabled={isSubmitting}
              />
              {error && (
                <p className="text-sm text-destructive mt-1">{error}</p>
              )}
              {joinMessage && (
                <p className="text-sm text-primary mt-1">{joinMessage}</p>
              )}
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={handleBeginInspection}
              disabled={!truckNumber.trim() || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Begin Inspection'}
            </Button>
          </CardContent>
        </Card>

        {/* In-Progress Inspections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              In-Progress Inspections
            </CardTitle>
            <CardDescription>
              Continue an existing inspection
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-4">
                Loading inspections...
              </p>
            ) : inspections.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No inspections in progress
              </p>
            ) : (
              <div className="space-y-3">
                {inspections.map((inspection) => (
                  <div
                    key={inspection.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-lg">
                          Truck #{inspection.truckNumber}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Users className="w-4 h-4" />
                          <span>
                            {inspection.inspector1}
                            {inspection.inspector2 && `, ${inspection.inspector2}`}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Started: {formatTimestamp(inspection.createdAt)}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleContinueInspection(inspection.id)}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inspection History */}
        <Card className="mt-6">
          <CardHeader 
            className="cursor-pointer"
            onClick={() => setShowHistory(!showHistory)}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5" />
                My Inspection History
              </div>
              {showHistory ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </CardTitle>
            <CardDescription>
              View your completed inspections
            </CardDescription>
          </CardHeader>
          
          {showHistory && (
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 flex-wrap">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={historyStartDate}
                    onChange={(e) => setHistoryStartDate(e.target.value)}
                    className="w-auto"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="date"
                    value={historyEndDate}
                    onChange={(e) => setHistoryEndDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Filter by truck #"
                    value={historyTruckFilter}
                    onChange={(e) => setHistoryTruckFilter(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleApplyHistoryFilters}
                  disabled={historyLoading}
                >
                  {historyLoading ? 'Loading...' : 'Apply Filters'}
                </Button>
              </div>

              {/* Error message */}
              {historyError && (
                <p className="text-sm text-destructive">{historyError}</p>
              )}

              {/* History list */}
              {historyLoading ? (
                <p className="text-center text-muted-foreground py-4">
                  Loading history...
                </p>
              ) : filteredHistoryInspections.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No inspections found for the selected period
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredHistoryInspections.map((inspection) => (
                    <div
                      key={inspection.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleViewInspection(inspection)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">
                            Truck #{inspection.truckNumber}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span className={`px-2 py-0.5 rounded-full ${
                              inspection.status === 'complete' 
                                ? 'bg-green-100 text-green-800'
                                : inspection.status === 'gone'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {inspection.status}
                            </span>
                            <span>
                              {formatTimestamp(inspection.createdAt)}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewInspection(inspection);
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </main>

      {/* Inspection Detail Modal */}
      <InspectionDetailModal
        inspection={selectedInspection}
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedInspection(null);
        }}
      />
    </div>
  );
}
