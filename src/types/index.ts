import { Timestamp } from 'firebase/firestore';

// Inspector data model
export interface Inspector {
  id: string;
  name: string;
  email?: string;
  isAdmin: boolean;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Email recipient for inspection notifications
export interface EmailRecipient {
  id: string;
  name: string;
  email: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Checklist item data with audit info
export interface ChecklistItemData {
  value: string | null;
  comment: string;
  answeredBy: string;
  answeredAt: Timestamp | null;
  photoUrl?: string | null;
  photoTakenBy?: string | null;
  photoTakenAt?: Timestamp | null;
}

// Defect photo data
export interface DefectPhoto {
  url: string;
  caption?: string;
  takenBy: string;
  takenAt: Timestamp;
}

// Inspection status types
export type InspectionStatus = 'in-progress' | 'complete' | 'gone';

// Interior checklist fields
export interface InteriorChecklist {
  registration: ChecklistItemData;
  iftaCard: ChecklistItemData;
  eldInstructionSheet: ChecklistItemData;
  accidentHotlineCard: ChecklistItemData;
  insuranceCard: ChecklistItemData;
  blankLogBooks: ChecklistItemData;
}

// Exterior checklist fields
export interface ExteriorChecklist {
  dotAnnual: ChecklistItemData;
  iftaSticker: ChecklistItemData;
  tag: ChecklistItemData;
  hutSticker: ChecklistItemData;
  fireExtinguisher: ChecklistItemData;
  triangles: ChecklistItemData;
  tires: ChecklistItemData;
  mudflaps: ChecklistItemData;
}

// Complete inspection data model
export interface Inspection {
  id: string;
  truckNumber: string;
  status: InspectionStatus;
  inspector1: string;
  inspector2: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
  interior: InteriorChecklist;
  exterior: ExteriorChecklist;
  additionalDefects: string;
  defectPhotos?: DefectPhoto[];
}

// Checklist configuration types
export interface ChecklistItemConfig {
  id: string;
  label: string;
  options: string[];
}

export interface ChecklistSectionConfig {
  id: 'interior' | 'exterior';
  label: string;
  items: ChecklistItemConfig[];
}

// Auth context types
export interface AuthContextType {
  currentInspector: Inspector | null;
  setCurrentInspector: (inspector: Inspector | null) => void;
  isAuthenticated: boolean;
}

// Connection context types
export type ConnectionStatus = 'online' | 'offline' | 'syncing';

export interface ConnectionContextType {
  status: ConnectionStatus;
  setStatus: (status: ConnectionStatus) => void;
}
