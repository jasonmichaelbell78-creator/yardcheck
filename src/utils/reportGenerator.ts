import { jsPDF } from 'jspdf';
import type { Inspection, ChecklistItemData, InteriorChecklist, ExteriorChecklist } from '@/types';
import { CHECKLIST_CONFIG } from '@/config/checklist';

// PDF layout constants
const PAGE_HEIGHT_LIMIT = 280;
const LINE_HEIGHT_MULTIPLIER = 0.4;
const LINE_SPACING = 4;

// Format date for display
function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Format date for filename (YYYYMMDD)
function formatDateForFilename(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

// Format timestamp for display
function formatTimestamp(timestamp: { toDate: () => Date } | null): string {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate();
  return date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
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

export interface DailyReportData {
  date: Date;
  inspections: Inspection[];
  includeDetails: boolean;
}

export function generateDailyReport(data: DailyReportData): void {
  const { date, inspections, includeDetails } = data;
  
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

  // Helper to add a section separator
  const addSeparator = () => {
    yPosition += 3;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
  };

  // Filter inspections for the selected date
  const dateStr = date.toDateString();
  const dayInspections = inspections.filter((inspection) => {
    if (!inspection.createdAt) return false;
    return inspection.createdAt.toDate().toDateString() === dateStr;
  });

  // Calculate stats
  const completed = dayInspections.filter((i) => i.status === 'complete').length;
  const inProgress = dayInspections.filter((i) => i.status === 'in-progress').length;
  const gone = dayInspections.filter((i) => i.status === 'gone').length;

  // Get unique inspectors
  const inspectorSet = new Set<string>();
  dayInspections.forEach((inspection) => {
    if (inspection.inspector1) inspectorSet.add(inspection.inspector1);
    if (inspection.inspector2) inspectorSet.add(inspection.inspector2);
  });
  const inspectors = Array.from(inspectorSet).sort();

  // Title
  addLine('YARDCHECK DAILY REPORT', 18, true);
  yPosition += 5;

  // Date
  addLine(`Report Date: ${formatDateDisplay(date)}`, 12);
  addLine(`Generated: ${new Date().toLocaleString()}`, 10);
  yPosition += 5;

  addSeparator();

  // Summary Stats
  addLine('SUMMARY', 14, true);
  yPosition += 2;
  addLine(`Total Inspections: ${dayInspections.length}`, 11);
  addLine(`  • Completed: ${completed}`, 10);
  addLine(`  • In Progress: ${inProgress}`, 10);
  addLine(`  • Gone: ${gone}`, 10);
  yPosition += 5;

  // Inspectors who worked
  addLine('INSPECTORS ON DUTY', 14, true);
  yPosition += 2;
  if (inspectors.length === 0) {
    addLine('No inspectors recorded for this day', 10);
  } else {
    inspectors.forEach((name) => {
      const count = dayInspections.filter(
        (i) => i.inspector1 === name || i.inspector2 === name
      ).length;
      addLine(`  • ${name} (${count} inspection${count !== 1 ? 's' : ''})`, 10);
    });
  }
  yPosition += 5;

  addSeparator();

  // Inspections List
  addLine('INSPECTION DETAILS', 14, true);
  yPosition += 5;

  if (dayInspections.length === 0) {
    addLine('No inspections recorded for this day', 10);
  } else {
    dayInspections.forEach((inspection, index) => {
      // Check for page break before each inspection
      if (yPosition > PAGE_HEIGHT_LIMIT - 40) {
        doc.addPage();
        yPosition = 20;
      }

      addLine(`${index + 1}. Truck #${inspection.truckNumber}`, 12, true);
      addLine(`   Status: ${inspection.status.toUpperCase()}`, 10);
      addLine(`   Inspector(s): ${inspection.inspector1}${inspection.inspector2 ? `, ${inspection.inspector2}` : ''}`, 10);
      addLine(`   Started: ${formatTimestamp(inspection.createdAt)}`, 10);
      if (inspection.completedAt) {
        addLine(`   Completed: ${formatTimestamp(inspection.completedAt)}`, 10);
      }

      // Include detailed checklist if requested
      if (includeDetails) {
        yPosition += 3;
        
        for (const section of CHECKLIST_CONFIG) {
          addLine(`   ${section.label} Checklist:`, 10, true);
          
          for (const item of section.items) {
            const itemData = getItemData(section.id, item.id, inspection);
            const value = itemData?.value ?? 'Not Answered';
            const displayValue = value ? value.toUpperCase() : 'NOT ANSWERED';
            
            addLine(`      ${item.label}: ${displayValue}`, 9);
            
            if (itemData?.comment) {
              doc.setFont('helvetica', 'italic');
              addLine(`         Comment: ${itemData.comment}`, 8);
              doc.setFont('helvetica', 'normal');
            }
            
            if (itemData?.answeredBy) {
              doc.setTextColor(128, 128, 128);
              addLine(`         (by ${itemData.answeredBy})`, 8);
              doc.setTextColor(0, 0, 0);
            }
          }
        }

        if (inspection.additionalDefects) {
          addLine('   Additional Defects:', 10, true);
          addLine(`      ${inspection.additionalDefects}`, 9);
        }
      }

      yPosition += 5;
    });
  }

  // Footer
  yPosition += 10;
  if (yPosition > PAGE_HEIGHT_LIMIT - 15) {
    doc.addPage();
    yPosition = 20;
  }
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`YardCheck Daily Report - ${formatDateDisplay(date)}`, margin, yPosition);
  doc.text(`Page ${doc.internal.pages.length - 1}`, pageWidth - margin, yPosition, { align: 'right' });

  // Generate filename and save
  const filename = `daily-report-${formatDateForFilename(date)}.pdf`;
  doc.save(filename);
}
