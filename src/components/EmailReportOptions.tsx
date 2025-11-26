import { useState, useEffect, useMemo } from 'react';
import { Mail, Loader2, AlertCircle, CheckCircle, Camera, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { subscribeToEmailRecipients } from '@/services/emailRecipientService';
import { sendInspectionEmail } from '@/services/emailService';
import { CHECKLIST_CONFIG } from '@/config/checklist';
import type { Inspection, EmailRecipient, ChecklistItemData } from '@/types';
import { cn } from '@/utils/cn';

interface EmailReportOptionsProps {
  inspection: Inspection;
  onEmailSent?: () => void;
}

interface DefectItem {
  id: string;
  section: 'interior' | 'exterior';
  label: string;
  value: string;
  comment: string;
  hasPhoto: boolean;
}

// Get items that are considered defects/issues
function getDefectItems(inspection: Inspection): DefectItem[] {
  const defects: DefectItem[] = [];
  
  for (const section of CHECKLIST_CONFIG) {
    const sectionData = section.id === 'interior' 
      ? (inspection.interior as unknown as Record<string, ChecklistItemData>)
      : (inspection.exterior as unknown as Record<string, ChecklistItemData>);
    
    for (const item of section.items) {
      const itemData = sectionData[item.id];
      if (!itemData || !itemData.value) continue;
      
      // Check if this is a failed/flagged item
      const isFailed = 
        itemData.value === 'no' || 
        itemData.value === 'out-of-date' || 
        itemData.value === 'added';
      
      if (isFailed) {
        defects.push({
          id: `${section.id}.${item.id}`,
          section: section.id,
          label: item.label,
          value: itemData.value,
          comment: itemData.comment || '',
          hasPhoto: !!itemData.photoUrl,
        });
      }
    }
  }
  
  return defects;
}

export function EmailReportOptions({ inspection, onEmailSent }: EmailReportOptionsProps) {
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(true);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [includeAdditionalDefects, setIncludeAdditionalDefects] = useState(true);
  const [includePhotos, setIncludePhotos] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Get defect items from inspection
  const defectItems = useMemo(() => getDefectItems(inspection), [inspection]);
  
  // Check if there are any issues to report
  const hasDefects = defectItems.length > 0;
  const hasAdditionalDefects = !!inspection.additionalDefects?.trim();
  const hasDefectPhotos = (inspection.defectPhotos?.length || 0) > 0;
  const hasAnyIssues = hasDefects || hasAdditionalDefects || hasDefectPhotos;
  
  // Subscribe to email recipients
  useEffect(() => {
    const unsubscribe = subscribeToEmailRecipients(
      (data) => {
        setRecipients(data);
        setLoadingRecipients(false);
      },
      (err) => {
        console.error('Error loading recipients:', err);
        setLoadingRecipients(false);
      }
    );
    
    return () => unsubscribe();
  }, []);
  
  // Initialize selected items when defects change
  useEffect(() => {
    setSelectedItems(defectItems.map(d => d.id));
  }, [defectItems]);
  
  const handleRecipientToggle = (email: string) => {
    setSelectedRecipients(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };
  
  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };
  
  const handleSelectAllItems = () => {
    if (selectedItems.length === defectItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(defectItems.map(d => d.id));
    }
  };
  
  const handleSendEmail = async () => {
    if (selectedRecipients.length === 0) {
      setError('Please select at least one recipient');
      return;
    }
    
    if (selectedItems.length === 0 && !includeAdditionalDefects) {
      setError('Please select at least one item to include');
      return;
    }
    
    setError(null);
    setSending(true);
    
    try {
      await sendInspectionEmail({
        inspectionId: inspection.id,
        recipientEmails: selectedRecipients,
        selectedItems,
        includeAdditionalDefects,
        includePhotos,
      });
      
      setSuccess(true);
      onEmailSent?.();
    } catch (err) {
      console.error('Error sending email:', err);
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  };
  
  // Don't render if no issues to report
  if (!hasAnyIssues) {
    return null;
  }
  
  // Show success message
  if (success) {
    return (
      <Card className="mb-4 border-green-200 bg-green-50">
        <CardContent className="py-4">
          <div className="flex items-center gap-3 text-green-800">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Email report sent successfully!</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        
        {/* Recipients Section */}
        <div>
          <p className="text-sm font-medium mb-2">Send to:</p>
          {loadingRecipients ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading recipients...
            </div>
          ) : recipients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No email recipients configured. Add recipients in admin settings.
            </p>
          ) : (
            <div className="space-y-2">
              {recipients.map((recipient) => (
                <label 
                  key={recipient.id} 
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedRecipients.includes(recipient.email)}
                    onChange={() => handleRecipientToggle(recipient.email)}
                    className="w-4 h-4 rounded border-input"
                  />
                  <span className="text-sm">
                    {recipient.name} ({recipient.email})
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
        
        {/* Defect Items Section */}
        {hasDefects && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Include defect items:</p>
              <button
                type="button"
                onClick={handleSelectAllItems}
                className="text-xs text-primary hover:underline"
              >
                {selectedItems.length === defectItems.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {defectItems.map((item) => (
                <label 
                  key={item.id} 
                  className={cn(
                    "flex items-center gap-2 cursor-pointer p-2 rounded-md border",
                    selectedItems.includes(item.id) 
                      ? "border-primary bg-primary/5" 
                      : "border-gray-200"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleItemToggle(item.id)}
                    className="w-4 h-4 rounded border-input"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className={cn(
                      "ml-2 text-xs px-1.5 py-0.5 rounded",
                      item.value === 'no' || item.value === 'out-of-date' 
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    )}>
                      {item.value}
                    </span>
                    {item.hasPhoto && (
                      <Camera className="w-3 h-3 inline-block ml-2 text-gray-400" />
                    )}
                    {item.comment && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {item.comment}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
        
        {/* Additional Options */}
        <div className="space-y-2 pt-2 border-t">
          {hasAdditionalDefects && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAdditionalDefects}
                onChange={(e) => setIncludeAdditionalDefects(e.target.checked)}
                className="w-4 h-4 rounded border-input"
              />
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Include additional defects notes</span>
            </label>
          )}
          
          {(hasDefectPhotos || defectItems.some(d => d.hasPhoto)) && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includePhotos}
                onChange={(e) => setIncludePhotos(e.target.checked)}
                className="w-4 h-4 rounded border-input"
              />
              <Camera className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Include photos as attachments</span>
            </label>
          )}
        </div>
        
        {/* Send Button */}
        <Button
          onClick={handleSendEmail}
          disabled={sending || selectedRecipients.length === 0}
          className="w-full"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Send Email Report
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
