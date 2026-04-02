import { STATUS_MAP } from '../statuses';
import { formatTime12h } from '../utils';

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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            {shipment.boxCount}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v17M5.5 8h13M3.5 14h17"/><circle cx="12" cy="3" r="1"/></svg>
            {shipment.weight}
          </span>
        </div>
        {shipment.dateFormatted && (
          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {formatTime12h(shipment.dateFormatted)}
          </div>
        )}
      </div>
    </div>
  );
}
