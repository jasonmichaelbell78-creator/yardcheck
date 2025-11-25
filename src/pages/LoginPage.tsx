import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { useAuth } from '@/contexts/AuthContext';
import { useInspectors } from '@/hooks/useInspectors';

export function LoginPage() {
  const navigate = useNavigate();
  const { setCurrentInspector } = useAuth();
  const { inspectors, adminInspectors, loading, error } = useInspectors();
  const [selectedInspectorId, setSelectedInspectorId] = useState('');
  const [selectedAdminId, setSelectedAdminId] = useState('');

  const handleStartInspection = () => {
    const inspector = inspectors.find(i => i.id === selectedInspectorId);
    if (inspector) {
      setCurrentInspector(inspector);
      navigate('/trucks');
    }
  };

  const handleOpenDashboard = () => {
    const admin = adminInspectors.find(i => i.id === selectedAdminId);
    if (admin) {
      setCurrentInspector(admin);
      // Dashboard would be implemented in Phase 2
      alert('Dashboard coming in Phase 2');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">{error}</p>
            <Button className="w-full mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-4">
            <Truck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-primary">YardCheck</h1>
          <p className="text-muted-foreground mt-2">Trucking Yard Inspection</p>
        </div>

        {/* Connection Status */}
        <div className="flex justify-center mb-6">
          <ConnectionStatus />
        </div>

        {/* Inspector Login */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Inspector Login
            </CardTitle>
            <CardDescription>
              Select your name to start inspecting trucks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={selectedInspectorId}
              onChange={(e) => setSelectedInspectorId(e.target.value)}
              disabled={loading}
            >
              <option value="">Select Inspector...</option>
              {inspectors.map((inspector) => (
                <option key={inspector.id} value={inspector.id}>
                  {inspector.name}
                </option>
              ))}
            </Select>
            <Button
              className="w-full"
              size="lg"
              onClick={handleStartInspection}
              disabled={!selectedInspectorId || loading}
            >
              Start Inspection
            </Button>
          </CardContent>
        </Card>

        {/* Admin Login */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Admin Access
            </CardTitle>
            <CardDescription>
              Admin users can access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={selectedAdminId}
              onChange={(e) => setSelectedAdminId(e.target.value)}
              disabled={loading}
            >
              <option value="">Select Admin...</option>
              {adminInspectors.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name}
                </option>
              ))}
            </Select>
            <Button
              className="w-full"
              size="lg"
              variant="secondary"
              onClick={handleOpenDashboard}
              disabled={!selectedAdminId || loading}
            >
              Open Dashboard
            </Button>
          </CardContent>
        </Card>

        {/* Loading state */}
        {loading && (
          <p className="text-center text-muted-foreground mt-4">
            Loading inspectors...
          </p>
        )}
      </div>
    </div>
  );
}
