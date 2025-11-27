import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, ArrowLeft, CheckCircle, Save, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { ProgressBar } from '@/components/ProgressBar';
import { ChecklistSection } from '@/components/ChecklistSection';
import { DefectPhotos } from '@/components/DefectPhotos';
import { CapturedPhotos } from '@/components/CapturedPhotos';
import { EmailReportOptions } from '@/components/EmailReportOptions';
import { useAuth } from '@/contexts/AuthContext';
import { useInspection } from '@/hooks/useInspection';
import { CHECKLIST_CONFIG, TOTAL_CHECKLIST_ITEMS } from '@/config/checklist';
import { countCompletedItems, formatTimestamp } from '@/utils/validation';

export function InspectionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentInspector } = useAuth();
  const {
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
  } = useInspection(id || null);

  const [showGoneDialog, setShowGoneDialog] = useState(false);
  // Use inspection.additionalDefects as initial value when inspection loads
  const [localDefectsText, setLocalDefectsText] = useState('');
  const [defectsSaved, setDefectsSaved] = useState(true);

  // Compute the actual defects text - use local if modified, otherwise use inspection data
  const defectsText = defectsSaved ? (inspection?.additionalDefects ?? '') : localDefectsText;

  // Join as second inspector if not already on the inspection
  useEffect(() => {
    if (inspection && currentInspector) {
      const isFirstInspector = inspection.inspector1 === currentInspector.name;
      const isSecondInspector = inspection.inspector2 === currentInspector.name;
      
      if (!isFirstInspector && !isSecondInspector && !inspection.inspector2) {
        joinAsSecondInspector(currentInspector.name);
      }
    }
  }, [inspection, currentInspector, joinAsSecondInspector]);

  if (!currentInspector) {
    navigate('/');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading inspection...</p>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error || 'Inspection not found'}</p>
            <Button onClick={() => navigate('/trucks')}>Back to Trucks</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedItems = countCompletedItems(
    inspection.interior as unknown as Record<string, { value: string | null }>,
    inspection.exterior as unknown as Record<string, { value: string | null }>
  );
  const isComplete = completedItems === TOTAL_CHECKLIST_ITEMS;
  const isInspectionClosed = inspection.status !== 'in-progress';

  const handleValueChange = (section: 'interior' | 'exterior', itemId: string, value: string) => {
    updateItem(section, itemId, value, currentInspector.name);
  };

  const handleCommentChange = (section: 'interior' | 'exterior', itemId: string, comment: string) => {
    updateComment(section, itemId, comment, currentInspector.name);
  };

  const handlePhotoCapture = async (section: 'interior' | 'exterior', itemId: string, file: File) => {
    await captureItemPhoto(section, itemId, file, currentInspector.name);
  };

  const handlePhotoDelete = async (section: 'interior' | 'exterior', itemId: string) => {
    await deleteItemPhoto(section, itemId, currentInspector.name);
  };

  const handleDefectsChange = (text: string) => {
    setLocalDefectsText(text);
    setDefectsSaved(false);
  };

  const handleSaveDefects = () => {
    updateDefects(localDefectsText);
    setDefectsSaved(true);
  };

  const handleAddDefectPhoto = async (file: File, caption?: string) => {
    await addDefectPhotoToInspection(file, caption, currentInspector.name);
  };

  const handleDeleteDefectPhoto = async (photoUrl: string) => {
    await removeDefectPhotoFromInspection(photoUrl);
  };

  const handleComplete = async () => {
    await complete();
    navigate('/trucks');
  };

  const handleSaveIncomplete = () => {
    // Save defects if changed
    if (!defectsSaved) {
      updateDefects(localDefectsText);
    }
    navigate('/trucks');
  };

  const handleGone = async () => {
    await gone();
    setShowGoneDialog(false);
    navigate('/trucks');
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="bg-primary text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveIncomplete}
              className="text-white hover:bg-white/10 -ml-2"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back
            </Button>
            <ConnectionStatus />
          </div>
          <div className="flex items-center gap-3">
            <Truck className="w-8 h-8" />
            <div>
              <h1 className="font-bold text-xl">Truck #{inspection.truckNumber}</h1>
              <p className="text-sm text-white/80">
                {inspection.inspector1}
                {inspection.inspector2 && ` & ${inspection.inspector2}`}
                {' • '}
                Started {formatTimestamp(inspection.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto">
        {/* Progress */}
        <div className="mb-6">
          <ProgressBar current={completedItems} total={TOTAL_CHECKLIST_ITEMS} />
        </div>

        {/* Status banner for closed inspections */}
        {isInspectionClosed && (
          <Card className="mb-4 border-yellow-500 bg-yellow-50">
            <CardContent className="py-3 text-center">
              <p className="font-medium text-yellow-800">
                This inspection is {inspection.status === 'complete' ? 'completed' : 'closed (truck left)'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Checklist Sections */}
        {CHECKLIST_CONFIG.map((section) => (
          <ChecklistSection
            key={section.id}
            config={section}
            data={
              section.id === 'interior'
                ? (inspection.interior as unknown as Record<string, import('@/types').ChecklistItemData>)
                : (inspection.exterior as unknown as Record<string, import('@/types').ChecklistItemData>)
            }
            onValueChange={(itemId, value) => handleValueChange(section.id, itemId, value)}
            onCommentChange={(itemId, comment) => handleCommentChange(section.id, itemId, comment)}
            onPhotoCapture={(itemId, file) => handlePhotoCapture(section.id, itemId, file)}
            onPhotoDelete={(itemId) => handlePhotoDelete(section.id, itemId)}
            disabled={isInspectionClosed}
          />
        ))}

        {/* Additional Defects */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Additional Defects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Note any additional defects or issues..."
              value={defectsText}
              onChange={(e) => handleDefectsChange(e.target.value)}
              className="min-h-[100px]"
              disabled={isInspectionClosed}
            />
            {!defectsSaved && !isInspectionClosed && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDefects}
              >
                Save Notes
              </Button>
            )}
            
            {/* Defect Photos */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-2">Defect Photos</p>
              <DefectPhotos
                photos={inspection.defectPhotos || []}
                onAddPhoto={handleAddDefectPhoto}
                onDeletePhoto={handleDeleteDefectPhoto}
                disabled={isInspectionClosed}
              />
            </div>
          </CardContent>
        </Card>

        {/* Captured Photos Gallery */}
        <CapturedPhotos inspection={inspection} />

        {/* Email Report Options - shown only when there are defects/issues */}
        <EmailReportOptions inspection={inspection} />
      </main>

      {/* Fixed Bottom Actions */}
      {!isInspectionClosed && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
          <div className="max-w-md mx-auto space-y-2">
            <Button
              className="w-full"
              size="lg"
              variant="success"
              onClick={handleComplete}
              disabled={!isComplete}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Mark as Complete
            </Button>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant="outline"
                onClick={handleSaveIncomplete}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Incomplete
              </Button>
              <Button
                className="flex-1"
                variant="destructive"
                onClick={() => setShowGoneDialog(true)}
              >
                <Ban className="w-4 h-4 mr-2" />
                Gone (Left Yard)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Gone Confirmation Dialog */}
      <Dialog open={showGoneDialog} onClose={() => setShowGoneDialog(false)}>
        <DialogContent onClose={() => setShowGoneDialog(false)}>
          <DialogHeader>
            <DialogTitle>Confirm Truck Left Yard</DialogTitle>
            <DialogDescription>
              This will close the inspection with its current state. The truck has left the yard before the inspection was completed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoneDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleGone}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
