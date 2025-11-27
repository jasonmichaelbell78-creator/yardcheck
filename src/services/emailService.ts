import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '@/config/firebase';

const functions = getFunctions(app);

export interface SendInspectionEmailRequest {
  inspectionId: string;
  recipientEmails: string[];
  selectedItems: string[];
  includeAdditionalDefects: boolean;
  includePhotos: boolean;
}

export interface SendInspectionEmailResponse {
  success: boolean;
  message: string;
  emailsSent?: number;
}

/**
 * Send inspection email via Firebase Cloud Function
 */
export async function sendInspectionEmail(
  request: SendInspectionEmailRequest
): Promise<SendInspectionEmailResponse> {
  const sendEmail = httpsCallable<SendInspectionEmailRequest, SendInspectionEmailResponse>(
    functions,
    'sendInspectionEmail'
  );
  
  const result = await sendEmail(request);
  return result.data;
}
