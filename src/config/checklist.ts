import type { ChecklistSectionConfig, InteriorChecklist, ExteriorChecklist, ChecklistItemData } from '@/types';
import { Timestamp } from 'firebase/firestore';

// Checklist configuration defining all inspection items
export const CHECKLIST_CONFIG: ChecklistSectionConfig[] = [
  {
    id: "interior",
    label: "Interior",
    items: [
      { id: "registration", label: "Registration", options: ["yes", "no", "added"] },
      { id: "iftaCard", label: "IFTA Card", options: ["yes", "no", "added"] },
      { id: "eldInstructionSheet", label: "ELD Instruction Sheet", options: ["yes", "no", "added"] },
      { id: "accidentHotlineCard", label: "Accident Hotline Card", options: ["yes", "no", "added"] },
      { id: "insuranceCard", label: "Insurance Card", options: ["yes", "no", "added"] },
      { id: "blankLogBooks", label: "Blank Log Books", options: ["yes", "no", "added"] },
    ]
  },
  {
    id: "exterior",
    label: "Exterior",
    items: [
      { id: "dotAnnual", label: "DOT Annual", options: ["in-date", "out-of-date"] },
      { id: "iftaSticker", label: "IFTA Sticker", options: ["yes", "no", "added"] },
      { id: "tag", label: "Tag", options: ["in-date", "out-of-date"] },
      { id: "hutSticker", label: "HUT Sticker", options: ["yes", "no", "added"] },
      { id: "fireExtinguisher", label: "Fire Extinguisher", options: ["yes", "no"] },
      { id: "triangles", label: "Triangles", options: ["yes", "no"] },
      { id: "tires", label: "Tires", options: ["yes", "no"] },
      { id: "mudflaps", label: "Mudflaps", options: ["yes", "no"] },
    ]
  }
];

// Total number of checklist items
export const TOTAL_CHECKLIST_ITEMS = CHECKLIST_CONFIG.reduce(
  (total, section) => total + section.items.length, 
  0
);

// Create empty checklist item data
export function createEmptyChecklistItem(): ChecklistItemData {
  return {
    value: null,
    comment: '',
    answeredBy: '',
    answeredAt: null
  };
}

// Create default interior checklist
export function createDefaultInterior(): InteriorChecklist {
  return {
    registration: createEmptyChecklistItem(),
    iftaCard: createEmptyChecklistItem(),
    eldInstructionSheet: createEmptyChecklistItem(),
    accidentHotlineCard: createEmptyChecklistItem(),
    insuranceCard: createEmptyChecklistItem(),
    blankLogBooks: createEmptyChecklistItem(),
  };
}

// Create default exterior checklist
export function createDefaultExterior(): ExteriorChecklist {
  return {
    dotAnnual: createEmptyChecklistItem(),
    iftaSticker: createEmptyChecklistItem(),
    tag: createEmptyChecklistItem(),
    hutSticker: createEmptyChecklistItem(),
    fireExtinguisher: createEmptyChecklistItem(),
    triangles: createEmptyChecklistItem(),
    tires: createEmptyChecklistItem(),
    mudflaps: createEmptyChecklistItem(),
  };
}

// Create a new empty inspection
export function createNewInspection(truckNumber: string, inspectorName: string): Omit<import('@/types').Inspection, 'id'> {
  const now = Timestamp.now();
  return {
    truckNumber,
    status: 'in-progress',
    inspector1: inspectorName,
    inspector2: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    interior: createDefaultInterior(),
    exterior: createDefaultExterior(),
    additionalDefects: '',
  };
}
