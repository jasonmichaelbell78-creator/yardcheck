import { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { generateDailyReport } from '@/utils/reportGenerator';
import type { Inspection } from '@/types';

interface DailyReportModalProps {
  open: boolean;
  onClose: () => void;
  inspections: Inspection[];
}

export function DailyReportModal({ open, onClose, inspections }: DailyReportModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [includeDetails, setIncludeDetails] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Reset state when modal opens
  const handleClose = () => {
    setSelectedDate(today);
    setIncludeDetails(false);
    onClose();
  };

  // Count inspections for the selected date
  const getInspectionCount = () => {
    const dateObj = new Date(selectedDate + 'T00:00:00');
    const dateStr = dateObj.toDateString();
    return inspections.filter((inspection) => {
      if (!inspection.createdAt) return false;
      return inspection.createdAt.toDate().toDateString() === dateStr;
    }).length;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    
    try {
      // Small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      const reportDate = new Date(selectedDate + 'T00:00:00');
      generateDailyReport({
        date: reportDate,
        inspections,
        includeDetails,
      });
    } finally {
      setGenerating(false);
    }
  };

  const inspectionCount = getInspectionCount();

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate Daily Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Date Selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select Date</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={today}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {inspectionCount} inspection{inspectionCount !== 1 ? 's' : ''} on this date
            </p>
          </div>

          {/* Include Details Checkbox */}
          <label className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={includeDetails}
              onChange={(e) => setIncludeDetails(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-input"
            />
            <div>
              <span className="text-sm font-medium">Include detailed checklist data</span>
              <p className="text-xs text-muted-foreground mt-1">
                Full checklist breakdown, all comments, and which inspector answered each item
              </p>
            </div>
          </label>
        </div>

        <DialogFooter className="flex-row gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generating || inspectionCount === 0}
            className="flex-1"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
