import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import sgMail from "@sendgrid/mail";

// Initialize Firebase Admin
initializeApp();

const db = getFirestore();
const storage = getStorage();

// Interface definitions
interface ChecklistItemData {
  value: string | null;
  comment: string;
  answeredBy: string;
  photoUrl?: string | null;
}

interface DefectPhoto {
  url: string;
  caption?: string;
  takenBy: string;
  takenAt: Timestamp;
}

interface Inspection {
  id: string;
  truckNumber: string;
  inspector1: string;
  inspector2: string | null;
  createdAt: Timestamp;
  interior: Record<string, ChecklistItemData>;
  exterior: Record<string, ChecklistItemData>;
  additionalDefects: string;
  defectPhotos?: DefectPhoto[];
}

interface Inspector {
  id: string;
  name: string;
  email?: string;
}

interface SendInspectionEmailRequest {
  inspectionId: string;
  recipientEmails: string[];
  selectedItems: string[];
  includeAdditionalDefects: boolean;
  includePhotos: boolean;
}

// Checklist item labels
const CHECKLIST_LABELS: Record<string, string> = {
  registration: "Registration",
  iftaCard: "IFTA Card",
  eldInstructionSheet: "ELD Instruction Sheet",
  accidentHotlineCard: "Accident Hotline Card",
  insuranceCard: "Insurance Card",
  blankLogBooks: "Blank Log Books",
  dotAnnual: "DOT Annual",
  iftaSticker: "IFTA Sticker",
  tag: "Tag",
  hutSticker: "HUT Sticker",
  fireExtinguisher: "Fire Extinguisher",
  triangles: "Triangles",
  tires: "Tires",
  mudflaps: "Mudflaps",
};

// Download image from Firebase Storage URL and return as base64
async function downloadImage(url: string): Promise<{ content: string; type: string } | null> {
  try {
    // Extract bucket and path from Firebase Storage URL
    // Expected format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/b\/([^/]+)\/o\/(.+)/);
    
    if (!pathMatch) {
      console.error(
        "Invalid Firebase Storage URL format. Expected format: " +
        "https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}. " +
        "Received:", url
      );
      return null;
    }
    
    const bucketName = pathMatch[1];
    const filePath = decodeURIComponent(pathMatch[2]);
    
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);
    
    const [buffer] = await file.download();
    const base64 = buffer.toString("base64");
    
    // Determine content type
    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType || "image/jpeg";
    
    return {
      content: base64,
      type: contentType,
    };
  } catch (error) {
    console.error("Error downloading image:", error);
    return null;
  }
}

// Build HTML email body
function buildEmailBody(
  inspection: Inspection,
  selectedItems: string[],
  includeAdditionalDefects: boolean
): string {
  const inspectionDate = inspection.createdAt.toDate().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 16px; font-weight: bold; color: #1e40af; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
        .item { margin-bottom: 15px; padding: 10px; background-color: #f9f9f9; border-left: 3px solid #e53e3e; }
        .item-label { font-weight: bold; }
        .item-value { color: #e53e3e; }
        .item-comment { color: #666; font-size: 14px; margin-top: 5px; }
        .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Inspection Report</h1>
        <p>Truck #${inspection.truckNumber}</p>
      </div>
      <div class="content">
        <div class="section">
          <p><strong>Inspection Date:</strong> ${inspectionDate}</p>
          <p><strong>Inspector(s):</strong> ${inspection.inspector1}${inspection.inspector2 ? ` & ${inspection.inspector2}` : ""}</p>
        </div>
  `;

  // Add defect items
  if (selectedItems.length > 0) {
    html += `
        <div class="section">
          <div class="section-title">Defects & Issues</div>
    `;

    for (const itemId of selectedItems) {
      const [section, id] = itemId.split(".");
      const sectionData = section === "interior" ? inspection.interior : inspection.exterior;
      const itemData = sectionData[id];
      
      if (itemData && itemData.value) {
        const label = CHECKLIST_LABELS[id] || id;
        html += `
          <div class="item">
            <div class="item-label">${label}</div>
            <div class="item-value">Status: ${itemData.value}</div>
            ${itemData.comment ? `<div class="item-comment">Comment: ${itemData.comment}</div>` : ""}
          </div>
        `;
      }
    }

    html += "</div>";
  }

  // Add additional defects
  if (includeAdditionalDefects && inspection.additionalDefects) {
    html += `
        <div class="section">
          <div class="section-title">Additional Defects</div>
          <p>${inspection.additionalDefects.replace(/\n/g, "<br>")}</p>
        </div>
    `;
  }

  html += `
      </div>
      <div class="footer">
        <p>This report was generated by YardCheck Inspection System</p>
      </div>
    </body>
    </html>
  `;

  return html;
}

// Cloud Function to send inspection email
export const sendInspectionEmail = onCall<SendInspectionEmailRequest>(
  { 
    region: "us-central1",
    secrets: ["SENDGRID_API_KEY"],
  },
  async (request) => {
    // Validate request data
    const { inspectionId, recipientEmails, selectedItems, includeAdditionalDefects, includePhotos } = request.data;

    if (!inspectionId || typeof inspectionId !== "string") {
      throw new HttpsError("invalid-argument", "Inspection ID is required");
    }

    if (!Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      throw new HttpsError("invalid-argument", "At least one recipient email is required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of recipientEmails) {
      if (!emailRegex.test(email)) {
        throw new HttpsError("invalid-argument", `Invalid email address: ${email}`);
      }
    }

    // Get SendGrid API key from secret
    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    if (!sendGridApiKey) {
      throw new HttpsError("failed-precondition", "SendGrid API key not configured");
    }

    // Initialize SendGrid
    sgMail.setApiKey(sendGridApiKey);

    try {
      // Fetch inspection data
      const inspectionDoc = await db.collection("inspections").doc(inspectionId).get();
      if (!inspectionDoc.exists) {
        throw new HttpsError("not-found", "Inspection not found");
      }

      const inspection = { id: inspectionDoc.id, ...inspectionDoc.data() } as Inspection;

      // Fetch inspector email for "from" address
      let fromEmail = "noreply@yardcheck.app";
      const inspectorsQuery = await db.collection("inspectors")
        .where("name", "==", inspection.inspector1)
        .limit(1)
        .get();

      if (!inspectorsQuery.empty) {
        const inspectorData = inspectorsQuery.docs[0].data() as Inspector;
        if (inspectorData.email) {
          fromEmail = inspectorData.email;
        }
      }

      // Build email HTML
      const htmlContent = buildEmailBody(inspection, selectedItems || [], includeAdditionalDefects);

      // Prepare attachments if photos are included
      const attachments: sgMail.MailDataRequired["attachments"] = [];

      if (includePhotos) {
        // Add defect photos
        if (inspection.defectPhotos && inspection.defectPhotos.length > 0) {
          for (let i = 0; i < inspection.defectPhotos.length; i++) {
            const photo = inspection.defectPhotos[i];
            const imageData = await downloadImage(photo.url);
            if (imageData) {
              attachments.push({
                content: imageData.content,
                filename: `defect-photo-${i + 1}.jpg`,
                type: imageData.type,
                disposition: "attachment",
              });
            }
          }
        }

        // Add item photos for selected items
        for (const itemId of (selectedItems || [])) {
          const [section, id] = itemId.split(".");
          const sectionData = section === "interior" ? inspection.interior : inspection.exterior;
          const itemData = sectionData[id];

          if (itemData && itemData.photoUrl) {
            const imageData = await downloadImage(itemData.photoUrl);
            if (imageData) {
              const label = CHECKLIST_LABELS[id] || id;
              attachments.push({
                content: imageData.content,
                filename: `${label.replace(/\s+/g, "-").toLowerCase()}.jpg`,
                type: imageData.type,
                disposition: "attachment",
              });
            }
          }
        }
      }

      // Send email
      const msg: sgMail.MailDataRequired = {
        to: recipientEmails,
        from: {
          email: fromEmail,
          name: `YardCheck - ${inspection.inspector1}`,
        },
        subject: `Inspection Report - Truck #${inspection.truckNumber}`,
        html: htmlContent,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      await sgMail.send(msg);

      return {
        success: true,
        message: `Email sent to ${recipientEmails.length} recipient(s)`,
      };
    } catch (error) {
      console.error("Error sending email:", error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError("internal", "Failed to send email");
    }
  }
);
