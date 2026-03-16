import { STATUSES, STATUS_MAP, getNextStatus, getStatusIndex, EXCEPTION_STATUS } from '../statuses';

export default function DetailView({ shipment, onBack, onUpdate, onException, updating }) {
  const status = STATUS_MAP[shipment.status] || STATUS_MAP['InfoReceived'];
  const next = getNextStatus(shipment.status);
  const currentIdx = getStatusIndex(shipment.status);
  const isException = shipment.status === 'Exception';

  return (
    <div style={{ minHeight: '100vh', background: '#faf9f7' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1.5px solid #e5e7eb',
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, background: '#faf9f7', zIndex: 10,
      }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 10, background: '#f3f4f6',
          border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#6b7280', cursor: 'pointer', fontSize: 18,
        }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>
            {shipment.awb}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{shipment.customer}</div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: isException ? EXCEPTION_STATUS.color : status.color,
          background: isException ? EXCEPTION_STATUS.pill : status.pill,
          padding: '4px 10px', borderRadius: 20,
        }}>
          {isException ? 'Exception' : status.label}
        </span>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: 'Boxes', value: shipment.boxCount },
            { label: 'Weight', value: shipment.weight },
            { label: 'Ref', value: shipment.custRef || '-' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff', borderRadius: 10, padding: '10px 12px',
              border: '1.5px solid #e5e7eb',
            }}>
              <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>{s.label}</div>
              <div style={{
                fontSize: 14, fontWeight: 700, color: '#111827',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Timestamp */}
        {shipment.dateFormatted && (
          <div style={{
            background: '#fff', borderRadius: 10, padding: '10px 14px',
            border: '1.5px solid #e5e7eb', fontSize: 12, color: '#6b7280',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            🕐 Created: {shipment.dateFormatted}
          </div>
        )}

        {/* Address */}
        <div style={{
          background: '#fff', borderRadius: 10, padding: '12px 14px',
          border: '1.5px solid #e5e7eb',
        }}>
          <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>📍 Delivery Address</div>
          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{shipment.address}</div>
          {shipment.phone && (
            <a href={`tel:${shipment.phone}`} style={{
              display: 'inline-block', marginTop: 8, fontSize: 12,
              color: '#2563eb', textDecoration: 'none', fontWeight: 600,
            }}>
              📞 {shipment.phone}
            </a>
          )}
        </div>

        {/* IDs */}
        <div style={{
          background: '#fff', borderRadius: 10, padding: '12px 14px',
          border: '1.5px solid #e5e7eb',
        }}>
          <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 6 }}>Order Details</div>
          {[
            ['eShipz ID', shipment.id],
            ['Customer Ref', shipment.custRef || '-'],
            ['Source', shipment.orderSource || 'Self Delivery'],
          ].map(([k, v]) => (
            <div key={k} style={{
              display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4,
            }}>
              <span style={{ color: '#6b7280' }}>{k}</span>
              <span style={{ color: '#374151', fontFamily: 'monospace', fontSize: 11 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div style={{
          background: '#fff', borderRadius: 10, padding: '14px',
          border: '1.5px solid #e5e7eb',
        }}>
          <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Timeline
          </div>
          {STATUSES.slice(1).map((s, i) => {
            const done = getStatusIndex(s.key) <= currentIdx;
            const isNext = getStatusIndex(s.key) === currentIdx + 1;
            return (
              <div key={s.key} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${done ? '#059669' : isNext ? s.color : '#d1d5db'}`,
                    background: done ? '#059669' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isNext ? `0 0 8px ${s.color}33` : 'none',
                  }}>
                    {done && (
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                  {i < 3 && (
                    <div style={{
                      width: 2, height: 24,
                      background: done && getStatusIndex(STATUSES[i + 2]?.key) <= currentIdx ? '#a7f3d0' : '#e5e7eb',
                    }}/>
                  )}
                </div>
                <div style={{ paddingBottom: i < 3 ? 10 : 0 }}>
                  <span style={{
                    fontSize: 13, fontWeight: done || isNext ? 600 : 400,
                    color: done ? '#374151' : isNext ? s.color : '#9ca3af',
                  }}>
                    {s.label}
                  </span>
                  {isNext && <span style={{ fontSize: 11, color: s.color, marginLeft: 8, opacity: 0.7 }}>Next</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        {next ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <button
              onClick={() => onUpdate([shipment], next.key)}
              disabled={updating}
              style={{
                width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
                background: updating ? '#d1d5db' : next.key === 'Delivered' ? '#059669' : '#d97706',
                color: '#fff',
                fontSize: 16, fontWeight: 700, cursor: updating ? 'wait' : 'pointer',
                boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
              }}
            >
              {updating ? 'Updating...' : `Mark as ${next.label}`}
            </button>
            <button
              onClick={() => onException(shipment)}
              disabled={updating}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 12,
                border: '1.5px solid #fecaca', background: '#fff',
                color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              ⚠ Report Exception
            </button>
          </div>
        ) : (
          <div style={{
            width: '100%', padding: '16px 0', borderRadius: 14,
            background: '#d1fae5', border: '1.5px solid #a7f3d0',
            color: '#047857', fontSize: 15, fontWeight: 700, textAlign: 'center',
          }}>
            ✓ Delivered
          </div>
        )}
      </div>
    </div>
  );
}
