import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '@/config/firebase';

// Initialize Firebase Functions
const functions = getFunctions(app);

// Interface for email request data
export interface SendInspectionEmailRequest {
  inspectionId: string;
  recipientEmails: string[];
  selectedItems: string[];
  includeAdditionalDefects: boolean;
  includePhotos: boolean;
}

// Interface for email response
export interface SendInspectionEmailResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Send an inspection email report via Firebase Cloud Function
 */
export async function sendInspectionEmail(
  data: SendInspectionEmailRequest
): Promise<SendInspectionEmailResponse> {
  try {
    const sendEmail = httpsCallable<SendInspectionEmailRequest, SendInspectionEmailResponse>(
      functions,
      'sendInspectionEmail'
    );
    
    const result = await sendEmail(data);
    return result.data;
  } catch (error) {
    console.error('Error sending inspection email:', error);
    throw error;
  }
}
