export const STATUSES = [
  { key: 'InfoReceived', label: 'Info Received', short: 'Received', color: '#6b7280', bg: '#f3f4f6', pill: '#e5e7eb' },
  { key: 'PickedUp', label: 'Picked Up', short: 'Picked', color: '#b45309', bg: '#fef3c7', pill: '#fde68a' },
  { key: 'InTransit', label: 'In Transit', short: 'Transit', color: '#1d4ed8', bg: '#dbeafe', pill: '#bfdbfe' },
  { key: 'OutForDelivery', label: 'Out for Delivery', short: 'OFD', color: '#6d28d9', bg: '#ede9fe', pill: '#ddd6fe' },
  { key: 'Delivered', label: 'Delivered', short: 'Delivered', color: '#047857', bg: '#d1fae5', pill: '#a7f3d0' },
];

export const EXCEPTION_STATUS = {
  key: 'Exception', label: 'Exception', short: 'Exception', color: '#dc2626', bg: '#fee2e2', pill: '#fecaca'
};

export const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.key, s]));

export function getNextStatus(current) {
  const idx = STATUSES.findIndex(s => s.key === current);
  return idx >= 0 && idx < STATUSES.length - 1 ? STATUSES[idx + 1] : null;
}

export function getStatusIndex(key) {
  return STATUSES.findIndex(s => s.key === key);
}
