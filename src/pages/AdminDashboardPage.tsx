import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardList, CheckCircle, Clock, TrendingUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/StatsCard';
import { InspectionDetailModal } from '@/components/InspectionDetailModal';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToAllInspections } from '@/services/inspectionService';
import type { Inspection, InspectionStatus } from '@/types';
import { formatTimestamp } from '@/utils/validation';

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

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { currentInspector, setCurrentInspector } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [showModal, setShowModal] = useState(false);

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

      // Date filter
      if (dateFilter === 'today' && !isToday(inspection.createdAt)) {
        return false;
      } else if (dateFilter === 'week') {
        const date = inspection.createdAt?.toDate();
        if (!date) return false;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (date < weekAgo) return false;
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
  }, [inspections, statusFilter, dateFilter, searchQuery]);

  const handleBackToLogin = () => {
    setCurrentInspector(null);
    navigate('/');
  };

  const handleRowClick = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedInspection(null);
  };

  if (!currentInspector) {
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
          <div>
            <h1 className="font-bold text-xl">Admin Dashboard</h1>
            <p className="text-sm text-white/80">
              Welcome, {currentInspector.name}
            </p>
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
          <CardContent>
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

              {/* Date Filter */}
              <Select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
              </Select>
            </div>
          </CardContent>
        </Card>

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
                          {formatTimestamp(inspection.createdAt)}
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
        open={showModal}
        onClose={handleCloseModal}
      />
    </div>
  );
}
