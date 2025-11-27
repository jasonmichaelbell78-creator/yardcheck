// Validation utilities for the YardCheck app

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate truck number format
export function validateTruckNumber(truckNumber: string): boolean {
  // Truck number should not be empty and should be alphanumeric
  const trimmed = truckNumber.trim();
  if (!trimmed) return false;
  // Allow alphanumeric characters, dashes, and spaces
  return /^[a-zA-Z0-9\-\s]+$/.test(trimmed);
}

// Normalize truck number for display
export function normalizeTruckNumber(truckNumber: string): string {
  return truckNumber.trim().toUpperCase();
}

// Check if all checklist items are completed
export function isChecklistComplete(
  interior: Record<string, { value: string | null }>,
  exterior: Record<string, { value: string | null }>
): boolean {
  const interiorComplete = Object.values(interior).every(item => item.value !== null);
  const exteriorComplete = Object.values(exterior).every(item => item.value !== null);
  return interiorComplete && exteriorComplete;
}

// Count completed items
export function countCompletedItems(
  interior: Record<string, { value: string | null }>,
  exterior: Record<string, { value: string | null }>
): number {
  const interiorCount = Object.values(interior).filter(item => item.value !== null).length;
  const exteriorCount = Object.values(exterior).filter(item => item.value !== null).length;
  return interiorCount + exteriorCount;
}

// Format timestamp for display
export function formatTimestamp(timestamp: { toDate: () => Date } | null): string {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
