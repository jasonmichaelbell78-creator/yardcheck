import { useState, useEffect, useMemo } from 'react';
import { Mail, Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEmailRecipients } from '@/services/emailRecipientService';
import { sendInspectionEmail } from '@/services/emailService';
import type { EmailRecipient, Inspection, ChecklistItemData } from '@/types';
import { CHECKLIST_CONFIG } from '@/config/checklist';
import { cn } from '@/utils/cn';

interface EmailReportOptionsProps {
  inspection: Inspection;
}

interface DefectItem {
  id: string;
  section: 'interior' | 'exterior';
  label: string;
  value: string;
  comment: string;
}

export function EmailReportOptions({ inspection }: EmailReportOptionsProps) {
  const [enableEmail, setEnableEmail] = useState(false);
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [includeAdditionalDefects, setIncludeAdditionalDefects] = useState(true);
  const [includePhotos, setIncludePhotos] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get items with issues (not OK or has comment) - memoized for stable reference
  const defectItems = useMemo<DefectItem[]>(() => {
    const items: DefectItem[] = [];
    
    for (const section of CHECKLIST_CONFIG) {
      for (const item of section.items) {
        const data = section.id === 'interior'
          ? (inspection.interior[item.id as keyof typeof inspection.interior] as ChecklistItemData | undefined)
          : (inspection.exterior[item.id as keyof typeof inspection.exterior] as ChecklistItemData | undefined);
        
        if (data && (data.value !== 'OK' || data.comment)) {
          items.push({
            id: `${section.id}.${item.id}`,
            section: section.id,
            label: item.label,
            value: data.value || 'Not answered',
            comment: data.comment || '',
          });
        }
      }
    }
    
    return items;
  }, [inspection]);

  const hasAdditionalDefects = !!inspection.additionalDefects?.trim();
  const hasDefectPhotos = (inspection.defectPhotos?.length || 0) > 0;
  const hasAnyDefects = defectItems.length > 0 || hasAdditionalDefects;

  // Load recipients when email is enabled
  useEffect(() => {
    if (enableEmail && recipients.length === 0) {
      setLoadingRecipients(true);
      getEmailRecipients()
        .then((data) => {
          setRecipients(data);
          // Auto-select all defect items
          setSelectedItems(defectItems.map(item => item.id));
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to load recipients');
        })
        .finally(() => {
          setLoadingRecipients(false);
        });
    }
  }, [enableEmail, recipients.length, defectItems]);

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
      setSelectedItems(defectItems.map(item => item.id));
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

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await sendInspectionEmail({
        inspectionId: inspection.id,
        recipientEmails: selectedRecipients,
        selectedItems,
        includeAdditionalDefects,
        includePhotos,
      });

      if (result.success) {
        setSuccess(`Email sent successfully to ${result.emailsSent} recipient(s)`);
        // Reset form
        setEnableEmail(false);
        setSelectedRecipients([]);
      } else {
        setError(result.message || 'Failed to send email');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  // Don't show if there are no defects
  if (!hasAnyDefects) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mail className="w-5 h-5" />
          <span>Email Report</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable Email Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enableEmail}
            onChange={(e) => setEnableEmail(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          <span className="text-sm font-medium">Send email notification for defects</span>
        </label>

        {/* Email Options (shown when enabled) */}
        {enableEmail && (
          <div className="space-y-4 pt-2 border-t">
            {/* Recipients Selection */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Select Recipients</p>
              {loadingRecipients ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading recipients...
                </div>
              ) : recipients.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No recipients configured. Go to Admin Dashboard to add recipients.
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {recipients.map((recipient) => (
                    <label
                      key={recipient.id}
                      className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecipients.includes(recipient.email)}
                        onChange={() => handleRecipientToggle(recipient.email)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm">{recipient.name}</span>
                      <span className="text-xs text-muted-foreground">({recipient.email})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Items Selection */}
            {defectItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Include Defect Items</p>
                  <button
                    type="button"
                    onClick={handleSelectAllItems}
                    className="text-xs text-primary hover:underline"
                  >
                    {selectedItems.length === defectItems.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {defectItems.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-2 cursor-pointer p-2 rounded-md hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleItemToggle(item.id)}
                        className="w-4 h-4 mt-0.5 rounded border-gray-300"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className={cn(
                          'ml-2 text-xs px-1.5 py-0.5 rounded',
                          item.value === 'Needs Attention' && 'bg-yellow-100 text-yellow-800',
                          item.value === 'Critical' && 'bg-red-100 text-red-800',
                          item.value === 'OK' && 'bg-green-100 text-green-800',
                          item.value === 'Not answered' && 'bg-gray-100 text-gray-800'
                        )}>
                          {item.value}
                        </span>
                        {item.comment && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
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
            <div className="space-y-2">
              {hasAdditionalDefects && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAdditionalDefects}
                    onChange={(e) => setIncludeAdditionalDefects(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm">Include additional defects notes</span>
                </label>
              )}
              
              {hasDefectPhotos && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePhotos}
                    onChange={(e) => setIncludePhotos(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm">Include defect photos as attachments</span>
                </label>
              )}
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-md text-sm">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {success}
              </div>
            )}

            {/* Send Button */}
            <Button
              onClick={handleSendEmail}
              disabled={loading || selectedRecipients.length === 0}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Email Report
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
