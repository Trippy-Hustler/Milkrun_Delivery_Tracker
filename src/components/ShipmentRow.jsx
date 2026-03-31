import { STATUS_MAP } from '../statuses';

export default function ShipmentRow({ shipment, isSelected, onToggle, onSelect, selectionMode }) {
  const status = STATUS_MAP[shipment.status] || STATUS_MAP['InfoReceived'];

  return (
    <div
      onClick={() => selectionMode ? onToggle(shipment.id) : onSelect(shipment)}
      style={{
        background: isSelected ? '#eff6ff' : '#fff',
        borderRadius: 12, padding: '12px 14px',
        cursor: 'pointer', transition: 'all 0.12s',
        border: isSelected ? '1.5px solid #3b82f6' : '1.5px solid #e5e7eb',
        display: 'flex', alignItems: 'center', gap: 12,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Checkbox */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#6b7280' }}>
          <span style={{ fontWeight: 600, color: '#374151' }}>{shipment.customer}</span>
          <span>📦 {shipment.boxCount}</span>
          <span>⚖ {shipment.weight}</span>
        </div>
        {shipment.dateFormatted && (
          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>
            🕐 {shipment.dateFormatted}
          </div>
        )}
      </div>
    </div>
  );
}
