import { jsPDF } from 'jspdf';
import type { Inspection, ChecklistItemData, InteriorChecklist, ExteriorChecklist, DefectPhoto } from '@/types';
import { CHECKLIST_CONFIG } from '@/config/checklist';

// Format timestamp for PDF display
function formatDate(timestamp: { toDate: () => Date } | null): string {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate();
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Format date for filename (YYYYMMDD)
function formatDateForFilename(timestamp: { toDate: () => Date } | null): string {
  if (!timestamp) return 'unknown';
  const date = timestamp.toDate();
  return date.toISOString().split('T')[0].replace(/-/g, '');
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

// PDF layout constants
const PAGE_HEIGHT_LIMIT = 280;
const LINE_HEIGHT_MULTIPLIER = 0.4;
const LINE_SPACING = 4;
const PHOTO_WIDTH = 60;
const PHOTO_HEIGHT = 45;
const PHOTO_LABEL_MAX_LENGTH = 20;
const PHOTO_LABEL_TRUNCATE_LENGTH = 17;

// Fetch image and convert to base64 data URL
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch image: ${response.status} ${response.statusText} for URL: ${url}`);
      return null;
    }
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn(`Error fetching image from ${url}:`, err);
    return null;
  }
}

// Extract image format from base64 data URL
function getImageFormatFromBase64(base64: string): string {
  const match = base64.match(/^data:image\/(\w+);base64,/);
  if (match) {
    const format = match[1].toUpperCase();
    // jsPDF supports JPEG, PNG, WEBP, GIF
    if (['JPEG', 'JPG', 'PNG', 'WEBP', 'GIF'].includes(format)) {
      return format === 'JPG' ? 'JPEG' : format;
    }
  }
  // Default to JPEG as fallback
  return 'JPEG';
}

interface PhotoData {
  label: string;
  base64: string;
}

export async function generateInspectionPDF(inspection: Inspection): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = 20;

  // Helper to add line and move down
  const addLine = (text: string, fontSize: number = 10, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    // Handle text wrapping
    const lines = doc.splitTextToSize(text, contentWidth);
    
    // Check if we need a new page
    if (yPosition + lines.length * (fontSize * LINE_HEIGHT_MULTIPLIER) > PAGE_HEIGHT_LIMIT) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * (fontSize * LINE_HEIGHT_MULTIPLIER) + LINE_SPACING;
  };

  // Helper to check and add new page if needed
  const checkNewPage = (heightNeeded: number) => {
    if (yPosition + heightNeeded > PAGE_HEIGHT_LIMIT) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // Title
  addLine('YARDCHECK INSPECTION REPORT', 18, true);
  yPosition += 5;

  // Truck and status info
  addLine(`Truck Number: ${inspection.truckNumber}`, 14, true);
  addLine(`Status: ${inspection.status.toUpperCase()}`, 12);
  yPosition += 3;

  // Inspector info
  addLine('Inspectors:', 12, true);
  addLine(`Primary: ${inspection.inspector1}`, 10);
  if (inspection.inspector2) {
    addLine(`Secondary: ${inspection.inspector2}`, 10);
  }
  yPosition += 3;

  // Timestamps
  addLine('Timeline:', 12, true);
  addLine(`Started: ${formatDate(inspection.createdAt)}`, 10);
  addLine(`Last Updated: ${formatDate(inspection.updatedAt)}`, 10);
  if (inspection.completedAt) {
    addLine(`Completed: ${formatDate(inspection.completedAt)}`, 10);
  }
  yPosition += 5;

  // Horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Checklist sections
  for (const section of CHECKLIST_CONFIG) {
    addLine(`${section.label} Checklist`, 14, true);
    yPosition += 2;

    for (const item of section.items) {
      const itemData = getItemData(section.id, item.id, inspection);
      const value = itemData?.value ?? 'Not Answered';
      const displayValue = value ? value.toUpperCase() : 'NOT ANSWERED';
      
      addLine(`${item.label}: ${displayValue}`, 10);
      
      if (itemData?.comment) {
        doc.setFont('helvetica', 'italic');
        addLine(`   Comment: ${itemData.comment}`, 9);
        doc.setFont('helvetica', 'normal');
      }
      
      if (itemData?.answeredBy && itemData?.answeredAt) {
        const answeredDate = formatDate(itemData.answeredAt);
        doc.setTextColor(128, 128, 128);
        addLine(`   Answered by ${itemData.answeredBy} on ${answeredDate}`, 8);
        doc.setTextColor(0, 0, 0);
      }
    }
    yPosition += 5;
  }

  // Additional defects
  if (inspection.additionalDefects) {
    addLine('Additional Defects:', 14, true);
    yPosition += 2;
    addLine(inspection.additionalDefects, 10);
  }

  // Collect and load all photos
  const allPhotos: PhotoData[] = [];
  
  // Get photos from all checklist sections (interior and exterior)
  for (const section of CHECKLIST_CONFIG) {
    for (const item of section.items) {
      const itemData = getItemData(section.id, item.id, inspection);
      if (itemData?.photoUrl) {
        const base64 = await fetchImageAsBase64(itemData.photoUrl);
        if (base64) {
          allPhotos.push({ label: item.label, base64 });
        }
      }
    }
  }

  // Get defect photos
  const defectPhotos = inspection.defectPhotos || [];
  for (const photo of defectPhotos as DefectPhoto[]) {
    const base64 = await fetchImageAsBase64(photo.url);
    if (base64) {
      allPhotos.push({ label: photo.caption || 'Defect Photo', base64 });
    }
  }

  // Add photos section if there are any photos
  if (allPhotos.length > 0) {
    yPosition += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
    
    addLine('Inspection Photos', 14, true);
    yPosition += 5;

    // Add photos in a grid (2 per row)
    const photosPerRow = 2;
    const photoSpacing = 10;
    const labelHeight = 10;
    
    for (let i = 0; i < allPhotos.length; i++) {
      const photo = allPhotos[i];
      const col = i % photosPerRow;
      
      // Check if we need a new row
      if (col === 0 && i > 0) {
        yPosition += PHOTO_HEIGHT + labelHeight + 5;
      }
      
      // Check if we need a new page
      if (col === 0) {
        checkNewPage(PHOTO_HEIGHT + labelHeight + 10);
      }
      
      const xPos = margin + col * (PHOTO_WIDTH + photoSpacing);
      
      try {
        const imageFormat = getImageFormatFromBase64(photo.base64);
        doc.addImage(photo.base64, imageFormat, xPos, yPosition, PHOTO_WIDTH, PHOTO_HEIGHT);
        
        // Add label below photo
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const truncatedLabel = photo.label.length > PHOTO_LABEL_MAX_LENGTH 
          ? photo.label.substring(0, PHOTO_LABEL_TRUNCATE_LENGTH) + '...' 
          : photo.label;
        doc.text(truncatedLabel, xPos, yPosition + PHOTO_HEIGHT + 5);
      } catch {
        // If image fails to add, just add the label
        doc.setFontSize(8);
        doc.text(`[Image: ${photo.label}]`, xPos, yPosition + PHOTO_HEIGHT / 2);
      }
    }
    
    // Move past the last row of photos
    yPosition += PHOTO_HEIGHT + labelHeight + 10;
  }

  // Footer
  yPosition += 10;
  checkNewPage(20);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated on ${new Date().toLocaleString()}`, margin, yPosition);
  doc.text('YardCheck Inspection System', pageWidth - margin, yPosition, { align: 'right' });

  // Generate filename and save
  const dateStr = formatDateForFilename(inspection.createdAt);
  const filename = `inspection-${inspection.truckNumber}-${dateStr}.pdf`;
  doc.save(filename);
}
