import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Plus, Clock, Users, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { useAuth } from '@/contexts/AuthContext';
import { useInProgressInspections } from '@/hooks/useInspection';
import { createInspection } from '@/services/inspectionService';
import { validateTruckNumber, normalizeTruckNumber, formatTimestamp } from '@/utils/validation';

export function TruckEntryPage() {
  const navigate = useNavigate();
  const { currentInspector, setCurrentInspector } = useAuth();
  const { inspections, loading } = useInProgressInspections();
  const [truckNumber, setTruckNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleBeginInspection = async () => {
    if (!currentInspector) return;
    
    const normalizedTruckNumber = normalizeTruckNumber(truckNumber);
    
    if (!validateTruckNumber(normalizedTruckNumber)) {
      setError('Please enter a valid truck number');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const inspectionId = await createInspection(
        normalizedTruckNumber,
        currentInspector.name
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

  const handleLogout = () => {
    setCurrentInspector(null);
    navigate('/');
  };

  if (!currentInspector) {
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
              <p className="text-sm text-white/80">{currentInspector.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ConnectionStatus />
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
                }}
                className="text-lg"
                disabled={isSubmitting}
              />
              {error && (
                <p className="text-sm text-destructive mt-1">{error}</p>
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
      </main>
    </div>
  );
}
