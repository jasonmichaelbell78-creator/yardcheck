import { jsPDF } from 'jspdf';
import type { Inspection, ChecklistItemData, InteriorChecklist, ExteriorChecklist } from '@/types';
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

export function generateInspectionPDF(inspection: Inspection): void {
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

  // Footer
  yPosition += 10;
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
