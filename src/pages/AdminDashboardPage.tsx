import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardList, CheckCircle, Clock, TrendingUp, Search, Users, FileText, User, HelpCircle, Mail, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/StatsCard';
import { InspectionDetailModal } from '@/components/InspectionDetailModal';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { ManageInspectorsModal } from '@/components/ManageInspectorsModal';
import { DailyReportModal } from '@/components/DailyReportModal';
import { DateRangePicker } from '@/components/DateRangePicker';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToAllInspections } from '@/services/inspectionService';
import { getActiveInspectors } from '@/services/inspectorService';
import type { Inspection, InspectionStatus, Inspector } from '@/types';

function getStatusBadgeClass(status: InspectionStatus): string {
  switch (status) {
    case 'complete':
      return 'bg-green-100 text-green-800';
    case 'in-progress':
      return 'bg-blue-100 text-blue-800';
    case 'gone':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function isToday(timestamp: { toDate: () => Date } | null): boolean {
  if (!timestamp) return false;
  const date = timestamp.toDate();
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

// Format timestamp for display
function formatTimestampDisplay(timestamp: { toDate: () => Date } | null): string {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate();
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Check if date is within range
function isDateInRange(timestamp: { toDate: () => Date } | null, startDate: string, endDate: string): boolean {
  if (!timestamp) return false;
  const date = timestamp.toDate();
  
  // Normalize to date-only comparison
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (startDate) {
    const start = new Date(startDate + 'T00:00:00');
    if (dateOnly < start) return false;
  }
  
  if (endDate) {
    const end = new Date(endDate + 'T23:59:59');
    if (dateOnly > end) return false;
  }
  
  return true;
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { inspector, logout } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [allInspectors, setAllInspectors] = useState<Inspector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectorFilter, setInspectorFilter] = useState<string>('all');
  
  // Modals
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showManageInspectors, setShowManageInspectors] = useState(false);
  const [showDailyReport, setShowDailyReport] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAllInspections(
      (data) => {
        setInspections(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    // Load inspectors for filter
    getActiveInspectors()
      .then(setAllInspectors)
      .catch(console.error);

    return () => unsubscribe();
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const total = inspections.length;
    const completedToday = inspections.filter(
      (i) => i.status === 'complete' && isToday(i.completedAt)
    ).length;
    const inProgress = inspections.filter((i) => i.status === 'in-progress').length;
    const completed = inspections.filter((i) => i.status === 'complete').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completedToday, inProgress, completionRate };
  }, [inspections]);

  // Filter inspections
  const filteredInspections = useMemo(() => {
    return inspections.filter((inspection) => {
      // Status filter
      if (statusFilter !== 'all' && inspection.status !== statusFilter) {
        return false;
      }

      // Date range filter
      if (startDate || endDate) {
        if (!isDateInRange(inspection.createdAt, startDate, endDate)) {
          return false;
        }
      }

      // Inspector filter
      if (inspectorFilter !== 'all') {
        const matchesInspector1 = inspection.inspector1 === inspectorFilter;
        const matchesInspector2 = inspection.inspector2 === inspectorFilter;
        if (!matchesInspector1 && !matchesInspector2) {
          return false;
        }
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const truckMatch = inspection.truckNumber.toLowerCase().includes(query);
        const inspector1Match = inspection.inspector1.toLowerCase().includes(query);
        const inspector2Match = inspection.inspector2?.toLowerCase().includes(query) ?? false;
        if (!truckMatch && !inspector1Match && !inspector2Match) {
          return false;
        }
      }

      return true;
    });
  }, [inspections, statusFilter, startDate, endDate, inspectorFilter, searchQuery]);

  // Calculate inspector-specific stats when filtered
  const inspectorStats = useMemo(() => {
    if (inspectorFilter === 'all') return null;
    
    const inspectorInspections = filteredInspections;
    const total = inspectorInspections.length;
    const completed = inspectorInspections.filter((i) => i.status === 'complete').length;
    const inProgress = inspectorInspections.filter((i) => i.status === 'in-progress').length;
    
    return { total, completed, inProgress };
  }, [filteredInspections, inspectorFilter]);

  const handleBackToLogin = async () => {
    await logout();
    navigate('/');
  };

  const handleRowClick = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedInspection(null);
  };

  if (!inspector) {
    navigate('/');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="bg-primary text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToLogin}
              className="text-white hover:bg-white/10 -ml-2"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back to Login
            </Button>
            <ConnectionStatus />
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-bold text-xl">Admin Dashboard</h1>
              <p className="text-sm text-white/80">
                Welcome, {inspector.name}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/trucks')}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Truck className="w-4 h-4 mr-2" />
                Start Inspection
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('/YardCheck-User-Guide.pdf', '_blank')}
                className="text-white hover:bg-white/10"
              >
                <HelpCircle className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">User Guide</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDailyReport(true)}
                className="text-white hover:bg-white/10"
              >
                <FileText className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Daily Report</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/email-recipients')}
                className="text-white hover:bg-white/10"
              >
                <Mail className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Email Recipients</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowManageInspectors(true)}
                className="text-white hover:bg-white/10"
              >
                <Users className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Manage Inspectors</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatsCard
            icon={<ClipboardList className="w-6 h-6" />}
            label="Total Inspections"
            value={stats.total}
          />
          <StatsCard
            icon={<CheckCircle className="w-6 h-6" />}
            label="Completed Today"
            value={stats.completedToday}
          />
          <StatsCard
            icon={<Clock className="w-6 h-6" />}
            label="In Progress"
            value={stats.inProgress}
          />
          <StatsCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Completion Rate"
            value={`${stats.completionRate}%`}
          />
        </div>

        {/* Filters */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search truck #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {/* Status Filter */}
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="in-progress">In Progress</option>
                <option value="complete">Complete</option>
                <option value="gone">Gone</option>
              </Select>

              {/* Inspector Filter */}
              <Select
                value={inspectorFilter}
                onChange={(e) => setInspectorFilter(e.target.value)}
              >
                <option value="all">All Inspectors</option>
                {allInspectors.map((inspector) => (
                  <option key={inspector.id} value={inspector.name}>
                    {inspector.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Date Range Picker */}
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
          </CardContent>
        </Card>

        {/* Inspector Stats (when filtered) */}
        {inspectorStats && (
          <Card className="mb-4 border-blue-200 bg-blue-50/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">
                  Inspections by {inspectorFilter}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total:</span>{' '}
                  <span className="font-medium">{inspectorStats.total}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Completed:</span>{' '}
                  <span className="font-medium text-green-600">{inspectorStats.completed}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">In Progress:</span>{' '}
                  <span className="font-medium text-blue-600">{inspectorStats.inProgress}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inspection Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              Inspections ({filteredInspections.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredInspections.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No inspections found matching your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Truck #</th>
                      <th className="text-left p-3 font-medium hidden sm:table-cell">Inspector</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium hidden md:table-cell">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInspections.map((inspection) => (
                      <tr
                        key={inspection.id}
                        onClick={() => handleRowClick(inspection)}
                        className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <td className="p-3 font-medium">{inspection.truckNumber}</td>
                        <td className="p-3 hidden sm:table-cell">
                          {inspection.inspector1}
                          {inspection.inspector2 && (
                            <span className="text-muted-foreground"> +1</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(inspection.status)}`}>
                            {inspection.status}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground hidden md:table-cell">
                          {formatTimestampDisplay(inspection.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Inspection Detail Modal */}
      <InspectionDetailModal
        inspection={selectedInspection}
        open={showDetailModal}
        onClose={handleCloseDetailModal}
      />

      {/* Manage Inspectors Modal */}
      <ManageInspectorsModal
        open={showManageInspectors}
        onClose={() => setShowManageInspectors(false)}
      />

      {/* Daily Report Modal */}
      <DailyReportModal
        open={showDailyReport}
        onClose={() => setShowDailyReport(false)}
        inspections={inspections}
      />
    </div>
  );
}
