import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import * as sgMail from '@sendgrid/mail';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Define the SendGrid API key secret
const sendgridApiKey = defineSecret('SENDGRID_API_KEY');

// Define the from email address (can be configured via Firebase environment config)
// Default: noreply@yardcheck.app
const fromEmailAddress = defineString('FROM_EMAIL', { default: 'noreply@yardcheck.app' });

// Types
interface DefectPhoto {
  url: string;
  caption?: string;
  takenBy: string;
  takenAt: admin.firestore.Timestamp;
}

interface ChecklistItemData {
  value: string | null;
  comment: string;
  answeredBy: string;
  answeredAt: admin.firestore.Timestamp | null;
  photoUrl?: string | null;
  photoTakenBy?: string | null;
  photoTakenAt?: admin.firestore.Timestamp | null;
}

interface Inspection {
  id: string;
  truckNumber: string;
  status: 'in-progress' | 'complete' | 'gone';
  inspector1: string;
  inspector2: string | null;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  completedAt: admin.firestore.Timestamp | null;
  interior: Record<string, ChecklistItemData>;
  exterior: Record<string, ChecklistItemData>;
  additionalDefects: string;
  defectPhotos?: DefectPhoto[];
}

interface SendInspectionEmailRequest {
  inspectionId: string;
  recipientEmails: string[];
  selectedItems: string[];
  includeAdditionalDefects: boolean;
  includePhotos: boolean;
}

interface SendInspectionEmailResponse {
  success: boolean;
  message: string;
  emailsSent?: number;
}

// Checklist configuration (same as frontend)
const CHECKLIST_CONFIG = {
  interior: [
    { id: 'registration', label: 'Registration' },
    { id: 'iftaCard', label: 'IFTA Card' },
    { id: 'eldInstructionSheet', label: 'ELD Instruction Sheet' },
    { id: 'accidentHotlineCard', label: 'Accident Hotline Card' },
    { id: 'insuranceCard', label: 'Insurance Card' },
    { id: 'blankLogBooks', label: 'Blank Log Books' },
  ],
  exterior: [
    { id: 'dotAnnual', label: 'DOT Annual' },
    { id: 'iftaSticker', label: 'IFTA Sticker' },
    { id: 'tag', label: 'Tag' },
    { id: 'hutSticker', label: 'HUT Sticker' },
    { id: 'fireExtinguisher', label: 'Fire Extinguisher' },
    { id: 'triangles', label: 'Triangles' },
    { id: 'tires', label: 'Tires' },
    { id: 'mudflaps', label: 'Mudflaps' },
  ],
};

/**
 * Get the label for a checklist item
 */
function getItemLabel(sectionAndItemId: string): string {
  const [section, itemId] = sectionAndItemId.split('.');
  const items = section === 'interior' ? CHECKLIST_CONFIG.interior : CHECKLIST_CONFIG.exterior;
  const item = items.find((i) => i.id === itemId);
  return item?.label || itemId;
}

/**
 * Format a Firestore timestamp for display
 */
function formatTimestamp(timestamp: admin.firestore.Timestamp | null): string {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate();
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Generate HTML email body for inspection report
 */
function generateEmailBody(
  inspection: Inspection,
  selectedItems: string[],
  includeAdditionalDefects: boolean
): string {
  let html = `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.5; }
        h1 { color: #1a56db; }
        h2 { color: #444; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
        .header { background-color: #1a56db; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
        .item { margin-bottom: 15px; padding: 12px; background-color: #f8f9fa; border-radius: 6px; }
        .item-label { font-weight: bold; color: #333; }
        .item-value { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 14px; margin-left: 8px; }
        .value-ok { background-color: #d1fae5; color: #065f46; }
        .value-needs-attention { background-color: #fef3c7; color: #92400e; }
        .value-critical { background-color: #fee2e2; color: #991b1b; }
        .value-na { background-color: #e5e7eb; color: #374151; }
        .comment { margin-top: 8px; font-style: italic; color: #666; }
        .defects { background-color: #fef2f2; padding: 15px; border-radius: 6px; border-left: 4px solid #ef4444; }
        .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0; color: white;">YardCheck Inspection Report</h1>
      </div>
      <div class="content">
        <h2>Truck #${escapeHtml(inspection.truckNumber)}</h2>
        <p><strong>Inspector(s):</strong> ${escapeHtml(inspection.inspector1)}${inspection.inspector2 ? ` & ${escapeHtml(inspection.inspector2)}` : ''}</p>
        <p><strong>Status:</strong> ${inspection.status}</p>
        <p><strong>Completed:</strong> ${formatTimestamp(inspection.completedAt)}</p>
  `;

  // Add selected defect items
  if (selectedItems.length > 0) {
    html += '<h2>Inspection Items</h2>';
    
    for (const itemKey of selectedItems) {
      const [section, itemId] = itemKey.split('.');
      const sectionData = section === 'interior' ? inspection.interior : inspection.exterior;
      const itemData = sectionData[itemId];
      
      if (itemData) {
        const label = getItemLabel(itemKey);
        const value = itemData.value || 'Not answered';
        let valueClass = 'value-na';
        if (value === 'OK') valueClass = 'value-ok';
        else if (value === 'Needs Attention') valueClass = 'value-needs-attention';
        else if (value === 'Critical') valueClass = 'value-critical';
        
        html += `
          <div class="item">
            <span class="item-label">${escapeHtml(label)}</span>
            <span class="item-value ${valueClass}">${escapeHtml(value)}</span>
            ${itemData.comment ? `<div class="comment">Note: ${escapeHtml(itemData.comment)}</div>` : ''}
          </div>
        `;
      }
    }
  }

  // Add additional defects
  if (includeAdditionalDefects && inspection.additionalDefects) {
    html += `
      <h2>Additional Defects</h2>
      <div class="defects">
        ${escapeHtml(inspection.additionalDefects).replace(/\n/g, '<br>')}
      </div>
    `;
  }

  html += `
        <div class="footer">
          <p>This is an automated email from YardCheck inspection system.</p>
          <p>Report generated on ${new Date().toLocaleString('en-US')}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}

/**
 * Download a photo and convert to base64 for email attachment
 */
async function downloadPhotoAsBase64(url: string): Promise<{ content: string; type: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    return {
      content: base64,
      type: contentType,
    };
  } catch (error) {
    console.error('Failed to download photo:', error);
    return null;
  }
}

/**
 * Cloud Function: Send inspection email via SendGrid
 */
export const sendInspectionEmail = onCall(
  {
    secrets: [sendgridApiKey],
    timeoutSeconds: 120,
    memory: '256MiB',
  },
  async (request): Promise<SendInspectionEmailResponse> => {
    const data = request.data as SendInspectionEmailRequest;
    
    // Validate request
    if (!data.inspectionId) {
      throw new HttpsError('invalid-argument', 'Inspection ID is required');
    }
    
    if (!data.recipientEmails || data.recipientEmails.length === 0) {
      throw new HttpsError('invalid-argument', 'At least one recipient email is required');
    }
    
    // Check SendGrid API key
    const apiKey = sendgridApiKey.value();
    if (!apiKey) {
      throw new HttpsError(
        'failed-precondition',
        'SendGrid API key is not configured. Please set the SENDGRID_API_KEY secret.'
      );
    }
    
    // Initialize SendGrid with the API key
    sgMail.setApiKey(apiKey);
    
    try {
      // Fetch inspection data
      const inspectionDoc = await db.collection('inspections').doc(data.inspectionId).get();
      
      if (!inspectionDoc.exists) {
        throw new HttpsError('not-found', 'Inspection not found');
      }
      
      const inspection = {
        id: inspectionDoc.id,
        ...inspectionDoc.data(),
      } as Inspection;
      
      // Get the from email address from configuration
      const fromEmail = fromEmailAddress.value();
      
      // Generate email content
      const htmlBody = generateEmailBody(
        inspection,
        data.selectedItems,
        data.includeAdditionalDefects
      );
      
      // Prepare attachments (photos)
      const attachments: Array<{ content: string; filename: string; type: string; disposition: string }> = [];
      
      if (data.includePhotos) {
        // Add checklist item photos from interior and exterior sections
        for (const [sectionKey, items] of Object.entries(CHECKLIST_CONFIG)) {
          const sectionData = sectionKey === 'interior' ? inspection.interior : inspection.exterior;
          for (const item of items) {
            const itemData = sectionData[item.id];
            if (itemData?.photoUrl) {
              const photoData = await downloadPhotoAsBase64(itemData.photoUrl);
              if (photoData) {
                const extension = photoData.type.split('/')[1] || 'jpg';
                // Use item label as filename prefix for clarity
                const safeLabel = item.label.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
                attachments.push({
                  content: photoData.content,
                  filename: `${safeLabel}.${extension}`,
                  type: photoData.type,
                  disposition: 'attachment',
                });
              }
            }
          }
        }
        
        // Add defect photos
        if (inspection.defectPhotos && inspection.defectPhotos.length > 0) {
          let photoIndex = 1;
          for (const photo of inspection.defectPhotos) {
            const photoData = await downloadPhotoAsBase64(photo.url);
            if (photoData) {
              const extension = photoData.type.split('/')[1] || 'jpg';
              attachments.push({
                content: photoData.content,
                filename: `defect_photo_${photoIndex}.${extension}`,
                type: photoData.type,
                disposition: 'attachment',
              });
              photoIndex++;
            }
          }
        }
      }
      
      // Send email to each recipient
      const emailPromises = data.recipientEmails.map((email) => {
        const msg: sgMail.MailDataRequired = {
          to: email,
          from: fromEmail,
          subject: `YardCheck Inspection Report - Truck #${inspection.truckNumber}`,
          html: htmlBody,
          attachments: attachments.length > 0 ? attachments : undefined,
        };
        
        return sgMail.send(msg);
      });
      
      await Promise.all(emailPromises);
      
      return {
        success: true,
        message: 'Email sent successfully',
        emailsSent: data.recipientEmails.length,
      };
    } catch (error) {
      console.error('Error sending email:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError(
        'internal',
        `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
);
