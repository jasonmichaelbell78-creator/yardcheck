import { useState } from 'react';
import { FileDown, X, Truck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Inspection, ChecklistItemData, InteriorChecklist, ExteriorChecklist } from '@/types';
import { CHECKLIST_CONFIG } from '@/config/checklist';
import { generateInspectionPDF } from '@/utils/pdfGenerator';
import { formatTimestamp } from '@/utils/validation';
import { markAsGone } from '@/services/inspectionService';

interface InspectionDetailModalProps {
  inspection: Inspection | null;
  open: boolean;
  onClose: () => void;
  onStatusChanged?: () => void;
}

function getStatusBadgeClass(status: string): string {
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

function getValueBadgeClass(value: string | null): string {
  if (!value) return 'bg-gray-100 text-gray-600';
  if (value === 'yes' || value === 'in-date') return 'bg-green-100 text-green-800';
  if (value === 'no' || value === 'out-of-date') return 'bg-red-100 text-red-800';
  if (value === 'added') return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-600';
}

// Get item data from section
function getItemData(
  sectionId: 'interior' | 'exterior', 
  itemId: string, 
  inspection: Inspection
): ChecklistItemData | undefined {
  const sectionData = sectionId === 'interior' ? inspection.interior : inspection.exterior;
  return sectionData[itemId as keyof (InteriorChecklist | ExteriorChecklist)] as ChecklistItemData | undefined;
}

export function InspectionDetailModal({ inspection, open, onClose, onStatusChanged }: InspectionDetailModalProps) {
  const [showGoneConfirm, setShowGoneConfirm] = useState(false);
  const [markingAsGone, setMarkingAsGone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!inspection) return null;

  const handleExportPDF = () => {
    generateInspectionPDF(inspection);
  };

  const handleMarkAsGone = async () => {
    setMarkingAsGone(true);
    setError(null);
    
    try {
      await markAsGone(inspection.id);
      setShowGoneConfirm(false);
      if (onStatusChanged) onStatusChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as gone');
    } finally {
      setMarkingAsGone(false);
    }
  };

  const canMarkAsGone = inspection.status === 'in-progress';

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pr-8">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              Truck #{inspection.truckNumber}
            </DialogTitle>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status and Actions */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(inspection.status)}`}>
              {inspection.status.toUpperCase()}
            </span>
            <div className="flex gap-2">
              {canMarkAsGone && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGoneConfirm(true)}
                >
                  <Truck className="w-4 h-4 mr-2" />
                  Mark as Gone
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <FileDown className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Info Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Inspection Info</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p><strong>Primary Inspector:</strong> {inspection.inspector1}</p>
              {inspection.inspector2 && (
                <p><strong>Secondary Inspector:</strong> {inspection.inspector2}</p>
              )}
              <p><strong>Started:</strong> {formatTimestamp(inspection.createdAt)}</p>
              <p><strong>Last Updated:</strong> {formatTimestamp(inspection.updatedAt)}</p>
              {inspection.completedAt && (
                <p><strong>Completed:</strong> {formatTimestamp(inspection.completedAt)}</p>
              )}
            </CardContent>
          </Card>

          {/* Checklist Sections */}
          {CHECKLIST_CONFIG.map((section) => {
            return (
              <Card key={section.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{section.label} Checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {section.items.map((item) => {
                    const itemData = getItemData(section.id, item.id, inspection);
                    const value = itemData?.value;
                    
                    return (
                      <div key={item.id} className="flex flex-col gap-1 py-1 border-b border-gray-100 last:border-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{item.label}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getValueBadgeClass(value ?? null)}`}>
                            {value ? value.toUpperCase() : 'N/A'}
                          </span>
                        </div>
                        {itemData?.comment && (
                          <p className="text-xs text-muted-foreground italic pl-2">
                            Comment: {itemData.comment}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}

          {/* Additional Defects */}
          {inspection.additionalDefects && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Additional Defects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{inspection.additionalDefects}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>

      {/* Mark as Gone Confirmation Dialog */}
      <Dialog open={showGoneConfirm} onClose={() => setShowGoneConfirm(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark Truck as Gone?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will mark truck <strong>#{inspection.truckNumber}</strong> as "gone" (left the yard).
            This action cannot be undone.
          </p>
          <DialogFooter className="flex-row gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowGoneConfirm(false)}
              disabled={markingAsGone}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkAsGone}
              disabled={markingAsGone}
              className="flex-1"
            >
              {markingAsGone ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Mark as Gone'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
