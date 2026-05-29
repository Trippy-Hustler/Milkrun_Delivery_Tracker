import { STATUS_MAP } from '../statuses';

const DRIVER_TAG_COLORS = {
  Nagesh:  { bg: '#fef3c7', color: '#92400e' },
  Sushil:  { bg: '#fef3c7', color: '#92400e' },
  Chandan: { bg: '#e0f2fe', color: '#0369a1' },
};

export default function ShipmentRow({ shipment, isSelected, onToggle, onSelect, selectionMode, readOnly, driverTag }) {
  const status = STATUS_MAP[shipment.status] || STATUS_MAP['InfoReceived'];
  const tagStyle = driverTag ? (DRIVER_TAG_COLORS[driverTag] || { bg: '#f3f4f6', color: '#374151' }) : null;

  return (
    <div
      onClick={() => readOnly ? onSelect(shipment) : selectionMode ? onToggle(shipment.id) : onSelect(shipment)}
      style={{
        background: isSelected ? '#eff6ff' : '#fff',
        borderRadius: 12, padding: '12px 14px',
        cursor: 'pointer', transition: 'all 0.12s',
        border: isSelected ? '1.5px solid #3b82f6' : '1.5px solid #e5e7eb',
        display: 'flex', alignItems: 'center', gap: 12,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Checkbox — hidden in read-only mode */}
      {!readOnly && (
        <div
          onClick={(e) => { e.stopPropagation(); onToggle(shipment.id); }}
          style={{
            width: 22, height: 22, borderRadius: 6, flexShrink: 0,
            border: isSelected ? '2px solid #3b82f6' : '2px solid #d1d5db',
            background: isSelected ? '#3b82f6' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.12s',
          }}
        >
          {isSelected && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: '#111827',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            fontFamily: 'monospace',
          }}>
            {shipment.custRef || shipment.awb}
          </div>
          <span style={{
            fontSize: 10, fontWeight: 600, color: status.color,
            background: status.pill, padding: '3px 8px', borderRadius: 12,
            whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 8,
          }}>
            {status.short}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#6b7280', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: '#374151' }}>{shipment.customer}</span>
          <span>📦 {shipment.boxCount}</span>
          <span>⚖ {shipment.weight}</span>
          {driverTag && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
              background: tagStyle.bg, color: tagStyle.color,
            }}>{driverTag}</span>
          )}
        </div>
        {shipment.lastUpdatedAt && (
          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>
            🕐 {shipment.lastUpdatedAt}
          </div>
        )}
      </div>
    </div>
  );
}




