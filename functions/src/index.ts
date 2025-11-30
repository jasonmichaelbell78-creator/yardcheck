import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Get the default storage bucket for downloading photos
const storageBucket = admin.storage().bucket();

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
 * Download a photo using fetch (fallback method)
 */
async function fetchPhotoAsBase64(url: string): Promise<{ content: string; type: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Fetch failed:', response.status, response.statusText);
      return null;
    }
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    return {
      content: base64,
      type: contentType,
    };
  } catch (error) {
    console.error('Failed to fetch photo:', error);
    return null;
  }
}

/**
 * Download a photo and convert to base64 for email attachment
 * Uses Firebase Admin SDK to download directly from Storage, with fetch as fallback
 */
async function downloadPhotoAsBase64(url: string): Promise<{ content: string; type: string } | null> {
  try {
    // Try to extract file path from Firebase Storage URL
    // URLs look like: https://firebasestorage.googleapis.com/v0/b/BUCKET/o/PATH?token=XXX
    const urlObj = new URL(url);
    
    // Handle both firebasestorage.googleapis.com and storage.googleapis.com URLs
    // Use strict hostname matching to prevent subdomain attacks
    let filePath: string | null = null;
    
    if (urlObj.hostname === 'firebasestorage.googleapis.com') {
      // Extract path from /v0/b/bucket/o/encoded-path format
      const match = urlObj.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)/);
      if (match) {
        filePath = decodeURIComponent(match[1]);
      }
    } else if (urlObj.hostname === 'storage.googleapis.com') {
      // Direct storage URL format: /BUCKET_NAME/path/to/file
      // pathname starts with '/' so split gives ['', 'bucket', 'path', 'to', 'file']
      // We skip first 2 elements (empty string and bucket name) to get the file path
      const pathParts = urlObj.pathname.split('/').slice(2);
      filePath = pathParts.join('/');
    }
    
    if (!filePath) {
      console.error('Could not parse storage URL:', url);
      // Fallback to fetch method
      return await fetchPhotoAsBase64(url);
    }
    
    const file = storageBucket.file(filePath);
    const [buffer] = await file.download();
    const base64 = buffer.toString('base64');
    
    // Get content type from metadata
    const [metadata] = await file.getMetadata();
    const contentType = (metadata.contentType as string) || 'image/jpeg';
    
    return {
      content: base64,
      type: contentType,
    };
  } catch (error) {
    console.error('Failed to download photo via Admin SDK, trying fetch:', error);
    // Fallback to original fetch method
    return await fetchPhotoAsBase64(url);
  }
}

/**
 * Check rate limit for email sending (10 emails per hour per user)
 */
async function checkRateLimit(userId: string): Promise<void> {
  const rateLimitRef = db.collection('rateLimits').doc(userId);
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000); // 1 hour in milliseconds
  
  const doc = await rateLimitRef.get();
  
  if (doc.exists) {
    const data = doc.data();
    const recentEmails = (data?.emailTimestamps || [])
      .filter((timestamp: number) => timestamp > oneHourAgo);
    
    if (recentEmails.length >= 10) {
      throw new HttpsError(
        'resource-exhausted',
        'Too many emails sent. Please wait an hour before sending more.'
      );
    }
    
    // Add current timestamp
    await rateLimitRef.update({
      emailTimestamps: [...recentEmails, now]
    });
  } else {
    // First email from this user
    await rateLimitRef.set({
      emailTimestamps: [now]
    });
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
    // ===== AUTHENTICATION CHECK =====
    // Step 1: Make sure user is logged in
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'You must be logged in to send emails.'
      );
    }
    
    // Step 2: Get the user's ID for logging and rate limiting
    const userId = request.auth.uid;
    
    // Step 3: Check rate limit before proceeding
    await checkRateLimit(userId);
    // ===== END AUTHENTICATION CHECK =====
    
    const data = request.data as SendInspectionEmailRequest;
    
    // Validate request
    if (!data.inspectionId) {
      throw new HttpsError('invalid-argument', 'Inspection ID is required');
    }
    
    if (!data.recipientEmails || data.recipientEmails.length === 0) {
      throw new HttpsError('invalid-argument', 'At least one recipient email is required');
    }
    
    // Check SendGrid API key
    const apiKey = sendgridApiKey.value().trim();
    if (!apiKey) {
      throw new HttpsError(
        'failed-precondition',
        'SendGrid API key not configured. Please add the SENDGRID_API_KEY secret to your GitHub repository (Settings → Secrets and variables → Actions) and re-run the deployment workflow. See SETUP_GUIDE.md for detailed instructions.'
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
      
      // Audit log
      console.log(`[AUDIT] User ${userId} sending email for inspection ${data.inspectionId}`);
      
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
      
      // Check for SendGrid-specific errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorBody = (error as { response?: { body?: { errors?: Array<{ message: string }> } } })?.response?.body;
      
      // Handle common SendGrid errors with user-friendly messages
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        throw new HttpsError(
          'unauthenticated',
          'SendGrid API key is invalid. Please check that the SENDGRID_API_KEY secret in GitHub is correct and re-run the deployment.'
        );
      }
      
      const errorsList = Array.isArray(errorBody?.errors) ? errorBody.errors : [];
      if (errorMessage.includes('forbidden') || errorMessage.includes('403') || 
          errorsList.some((e: { message: string }) => e.message?.includes('sender'))) {
        throw new HttpsError(
          'failed-precondition',
          'The sender email address is not verified in SendGrid. Please verify your sender email in SendGrid (Settings → Sender Authentication) and ensure the FROM_EMAIL secret matches. See SETUP_GUIDE.md for instructions.'
        );
      }
      
      throw new HttpsError(
        'internal',
        `Failed to send email: ${errorMessage}`
      );
    }
  }
);

// Stock password for new accounts - configurable via environment
// This password is intentionally simple and known because:
// 1. Users MUST change it on first login (mustChangePassword flag is set)
// 2. It's only used for initial account setup
// 3. Can be overridden via Firebase environment config if needed
const stockPassword = defineString('STOCK_PASSWORD', { default: 'YardCheck2024!' });

// Types for auth management
interface CreateInspectorAccountRequest {
  name: string;
  email: string;
  isAdmin: boolean;
}

interface CreateInspectorAccountResponse {
  success: boolean;
  inspectorId: string;
  message: string;
}

interface ResetInspectorPasswordRequest {
  inspectorId: string;
}

interface ResetInspectorPasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Helper function to check if the caller is an admin
 */
async function verifyAdminCaller(callerUid: string | undefined): Promise<void> {
  if (!callerUid) {
    throw new HttpsError('unauthenticated', 'You must be logged in to perform this action.');
  }
  
  // Get the caller's email from Firebase Auth
  const callerRecord = await admin.auth().getUser(callerUid);
  const callerEmail = callerRecord.email?.toLowerCase();
  
  if (!callerEmail) {
    throw new HttpsError('permission-denied', 'Could not verify your admin status.');
  }
  
  // Find the inspector document by email
  const inspectorQuery = await db.collection('inspectors')
    .where('email', '==', callerEmail)
    .where('active', '==', true)
    .limit(1)
    .get();
  
  if (inspectorQuery.empty) {
    throw new HttpsError('permission-denied', 'You are not registered as an inspector.');
  }
  
  const inspectorDoc = inspectorQuery.docs[0];
  const inspectorData = inspectorDoc.data();
  
  if (!inspectorData.isAdmin) {
    throw new HttpsError('permission-denied', 'Only admins can perform this action.');
  }
}

/**
 * Cloud Function: Create a new inspector account
 * Creates a Firebase Auth user and Firestore document
 */
export const createInspectorAccount = onCall(
  {
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request): Promise<CreateInspectorAccountResponse> => {
    const data = request.data as CreateInspectorAccountRequest;
    
    // Verify the caller is an admin
    await verifyAdminCaller(request.auth?.uid);
    
    // Audit log
    console.log(`[AUDIT] Admin ${request.auth?.uid} creating new inspector account: ${data.email}`);
    
    // Validate request
    if (!data.name || !data.name.trim()) {
      throw new HttpsError('invalid-argument', 'Inspector name is required.');
    }
    
    if (!data.email || !data.email.trim()) {
      throw new HttpsError('invalid-argument', 'Email is required.');
    }
    
    const email = data.email.trim().toLowerCase();
    const name = data.name.trim();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new HttpsError('invalid-argument', 'Invalid email format.');
    }
    
    try {
      // Check if an inspector with this email already exists in Firestore
      const existingInspector = await db.collection('inspectors')
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (!existingInspector.empty) {
        throw new HttpsError('already-exists', 'An inspector with this email already exists.');
      }
      
      // Create Firebase Auth user
      try {
        await admin.auth().createUser({
          email: email,
          password: stockPassword.value(),
          displayName: name,
        });
      } catch (authError) {
        const error = authError as { code?: string };
        if (error.code === 'auth/email-already-exists') {
          throw new HttpsError('already-exists', 'An account with this email already exists.');
        }
        throw authError;
      }
      
      // Create Firestore document
      const now = admin.firestore.Timestamp.now();
      const inspectorData = {
        name: name,
        email: email,
        isAdmin: data.isAdmin ?? false,
        active: true,
        mustChangePassword: true,
        createdAt: now,
        updatedAt: now,
      };
      
      const docRef = await db.collection('inspectors').add(inspectorData);
      
      return {
        success: true,
        inspectorId: docRef.id,
        message: `Inspector ${name} created successfully. They will need to change their password on first login.`,
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      
      console.error('Error creating inspector account:', error);
      throw new HttpsError(
        'internal',
        'Failed to create inspector account. Please try again.'
      );
    }
  }
);

/**
 * Cloud Function: Reset an inspector's password
 * Resets password to stock password and sets mustChangePassword flag
 */
export const resetInspectorPassword = onCall(
  {
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request): Promise<ResetInspectorPasswordResponse> => {
    const data = request.data as ResetInspectorPasswordRequest;
    
    // Verify the caller is an admin
    await verifyAdminCaller(request.auth?.uid);
    
    // Audit log
    console.log(`[AUDIT] Admin ${request.auth?.uid} resetting password for inspector ${data.inspectorId}`);
    
    // Validate request
    if (!data.inspectorId) {
      throw new HttpsError('invalid-argument', 'Inspector ID is required.');
    }
    
    try {
      // Get the inspector document
      const inspectorDoc = await db.collection('inspectors').doc(data.inspectorId).get();
      
      if (!inspectorDoc.exists) {
        throw new HttpsError('not-found', 'Inspector not found.');
      }
      
      const inspectorData = inspectorDoc.data();
      if (!inspectorData?.email) {
        throw new HttpsError('failed-precondition', 'Inspector does not have an email address.');
      }
      
      const email = inspectorData.email.toLowerCase();
      
      // Find the Firebase Auth user by email
      let userRecord: admin.auth.UserRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(email);
      } catch (authError) {
        const error = authError as { code?: string };
        if (error.code === 'auth/user-not-found') {
          throw new HttpsError('not-found', 'No authentication account found for this inspector.');
        }
        throw authError;
      }
      
      // Reset the password
      await admin.auth().updateUser(userRecord.uid, {
        password: stockPassword.value(),
      });
      
      // Update the mustChangePassword flag in Firestore
      await db.collection('inspectors').doc(data.inspectorId).update({
        mustChangePassword: true,
        updatedAt: admin.firestore.Timestamp.now(),
      });
      
      return {
        success: true,
        message: `Password reset successfully. ${inspectorData.name} will need to change their password on next login.`,
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      
      console.error('Error resetting inspector password:', error);
      throw new HttpsError(
        'internal',
        'Failed to reset password. Please try again.'
      );
    }
  }
);
