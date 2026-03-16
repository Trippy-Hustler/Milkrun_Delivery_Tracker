import { STATUS_MAP, getNextStatus } from '../statuses';

export default function BulkActionBar({ selected, shipments, onUpdate, onClear, updating }) {
  const selectedShipments = shipments.filter(s => selected.has(s.id));
  const statusGroups = {};
  selectedShipments.forEach(s => {
    if (!statusGroups[s.status]) statusGroups[s.status] = [];
    statusGroups[s.status].push(s);
  });
  const uniqueStatuses = Object.keys(statusGroups);
  const canBulk = uniqueStatuses.length === 1 && uniqueStatuses[0] !== 'Delivered';
  const next = canBulk ? getNextStatus(uniqueStatuses[0]) : null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 480, zIndex: 50, animation: 'slideUp 0.2s ease-out',
    }}>
      <div style={{
        margin: '0 12px 12px', padding: '14px 16px', borderRadius: 16,
        background: '#fff', border: '1.5px solid #e5e7eb',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: canBulk ? 12 : 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: '#d97706',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, color: '#fff',
            }}>{selected.size}</div>
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>selected</span>
            {!canBulk && uniqueStatuses.length > 1 && (
              <span style={{ fontSize: 11, color: '#d97706' }}>— mixed statuses</span>
            )}
          </div>
          <button onClick={onClear} style={{
            width: 32, height: 32, borderRadius: 8, background: '#f3f4f6',
            border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {canBulk && next && (
          <button
            onClick={() => onUpdate(selectedShipments, next.key)}
            disabled={updating}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
              background: updating ? '#d1d5db' : next.key === 'Delivered' ? '#059669' : '#d97706',
              color: '#fff',
              fontSize: 15, fontWeight: 700, cursor: updating ? 'wait' : 'pointer',
              boxShadow: updating ? 'none' : '0 2px 12px rgba(0,0,0,0.12)',
            }}
          >
            {updating
              ? `Updating ${selected.size} shipments...`
              : `Mark ${selected.size} as ${next.label}`}
          </button>
        )}

        {!canBulk && uniqueStatuses.length > 1 && (
          <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', padding: '8px 0 2px' }}>
            Select shipments with the same status to bulk update
          </div>
        )}
      </div>
    </div>
  );
}
