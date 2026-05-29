'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchShipments, updateStatus, bulkUpdateStatus } from './api';
import { STATUSES, STATUS_MAP, getNextStatus, EXCEPTION_STATUS } from './statuses';
import Toast from './components/Toast';
import BulkActionBar from './components/BulkActionBar';
import ShipmentRow from './components/ShipmentRow';
import DetailView from './components/DetailView';

const DRIVERS = ['Nagesh', 'Sushil', 'Chandan', 'Admin'];

// Route codes each driver is allowed to see (middle segment of AWB e.g. 2627/8/ST-1)
const DRIVER_ROUTES = {
  Nagesh:  ['2', '8'],
  Sushil:  ['2', '8'],
  Chandan: ['94'],
  Admin:   [], // empty = sees all routes
};

// Avatar colours per driver
const DRIVER_COLORS = {
  Nagesh:  '#d97706',
  Sushil:  '#d97706',
  Chandan: '#0891b2',
  Admin:   '#4f46e5',
};

export default function App() {
  const [driver, setDriver] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [detail, setDetail] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('snitch_driver');
    if (saved && DRIVERS.includes(saved)) setDriver(saved);
  }, []);

  const selectDriver = (name) => {
    localStorage.setItem('snitch_driver', name);
    setDriver(name);
  };

  const showToast = useCallback((msg, type = 'success') => setToast({ message: msg, type }), []);

  const loadShipments = useCallback(async (showRefreshToast = false) => {
    setRefreshing(true);
    setError(null);
    const result = await fetchShipments();
    if (result.success) {
      setShipments(result.data);
      if (showRefreshToast) showToast(`${result.data.length} shipments loaded`, 'info');
    } else {
      setError(result.error);
      showToast('Failed to load shipments', 'error');
    }
    setLoading(false);
    setRefreshing(false);
  }, [showToast]);

  useEffect(() => { if (driver) loadShipments(); }, [driver, loadShipments]);

  const driverMessage = `Driver: ${driver}`;

  const handleUpdate = useCallback(async (shipmentsToUpdate, newStatus) => {
    setUpdating(true);
    let result;
    if (shipmentsToUpdate.length === 1) {
      const s = shipmentsToUpdate[0];
      result = await updateStatus(s.id, newStatus, s.weight, driverMessage);
    } else {
      result = await bulkUpdateStatus(
        shipmentsToUpdate.map(s => ({ order_id: s.id, status: newStatus, weight: s.weight, message: driverMessage }))
      );
    }
    if (result.success) {
      const ids = new Set(shipmentsToUpdate.map(s => s.id));
      setShipments(prev => prev.map(s => ids.has(s.id) ? { ...s, status: newStatus, lastMessage: driverMessage } : s));
      if (detail && ids.has(detail.id)) setDetail(prev => prev ? { ...prev, status: newStatus, lastMessage: driverMessage } : null);
      setSelected(new Set());
      const label = STATUS_MAP[newStatus]?.label || newStatus;
      showToast(shipmentsToUpdate.length === 1
        ? `${shipmentsToUpdate[0].awb} → ${label}`
        : `${shipmentsToUpdate.length} shipments → ${label}`);
    } else {
      showToast(result.error || 'Update failed', 'error');
    }
    setUpdating(false);
  }, [detail, showToast, driverMessage]);

  const handleException = useCallback(async (shipment) => {
    setUpdating(true);
    const result = await updateStatus(shipment.id, 'Exception', shipment.weight, driverMessage);
    if (result.success) {
      setShipments(prev => prev.map(s => s.id === shipment.id ? { ...s, status: 'Exception', lastMessage: driverMessage } : s));
      if (detail?.id === shipment.id) setDetail(prev => prev ? { ...prev, status: 'Exception', lastMessage: driverMessage } : null);
      showToast(`${shipment.awb} → Exception reported`);
    } else {
      showToast('Failed to report exception', 'error');
    }
    setUpdating(false);
  }, [detail, showToast, driverMessage]);

  const toggleSelect = useCallback((id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAllInFilter = useCallback(() => {
    const routes = DRIVER_ROUTES[driver] || [];
    const filtered = shipments.filter(s => {
      const ref = s.custRef || s.awb || '';
      const route = ref.split('/')[1] || null;
      if (routes.length > 0 && !routes.includes(route)) return false;
      if (dateFrom || dateTo) {
        if (s.date) {
          const str = new Date(s.date).toISOString().split('T')[0];
          if (dateFrom && str < dateFrom) return false;
          if (dateTo && str > dateTo) return false;
        }
      }
      const mf = filter === 'All' || s.status === filter;
      const ms = !search || s.awb?.toLowerCase().includes(search.toLowerCase()) || s.customer?.toLowerCase().includes(search.toLowerCase());
      return mf && ms && s.status !== 'Delivered';
    });
    const allSelected = filtered.length > 0 && filtered.every(s => selected.has(s.id));
    setSelected(allSelected ? new Set() : new Set(filtered.map(s => s.id)));
  }, [shipments, filter, search, selected, dateFrom, dateTo]);

  // Parse driver from lastMessage (format: "Driver: Nagesh")
  const getShipmentDriver = (s) => {
    const msg = s.lastMessage || '';
    const match = msg.match(/^Driver:\s*(.+)$/i);
    return match ? match[1].trim() : null;
  };

  // Extract route code from AWB (e.g. "2627/94/QST-43" → "94")
  const getRouteCode = (s) => {
    const ref = s.custRef || s.awb || '';
    return ref.split('/')[1] || null;
  };

  const isInDateRange = (s) => {
    if (!dateFrom && !dateTo) return true;
    if (!s.date) return true;
    const str = new Date(s.date).toISOString().split('T')[0];
    if (dateFrom && str < dateFrom) return false;
    if (dateTo && str > dateTo) return false;
    return true;
  };

  // Is this shipment in the current driver's route?
  const isInRoute = (s) => {
    const routes = DRIVER_ROUTES[driver];
    if (!routes || routes.length === 0) return true;
    const route = getRouteCode(s);
    return routes.includes(route);
  };

  const filtered = shipments.filter(s => {
    if (driver !== 'Admin' && !isInRoute(s)) return false;
    if (!isInDateRange(s)) return false;
    const mf = filter === 'All' || s.status === filter;
    const ms = !search ||
      s.awb?.toLowerCase().includes(search.toLowerCase()) ||
      s.customer?.toLowerCase().includes(search.toLowerCase()) ||
      s.custRef?.toLowerCase().includes(search.toLowerCase());
    if (driver === 'Admin') return mf && ms;
    // Non-admin: InfoReceived + All show everything; other tabs only show this driver's shipments
    const shipmentDriver = getShipmentDriver(s);
    const isOtherDriver = s.status !== 'InfoReceived' && shipmentDriver && shipmentDriver !== driver;
    const md = filter === 'All' || filter === 'InfoReceived' ? true : !isOtherDriver;
    return mf && ms && md;
  });

  const downloadCSV = useCallback(() => {
    const isAdmin = driver === 'Admin';
    const headers = [
      'Pickup Date & Time', 'AWB', 'Invoice Number', 'Store Name',
      'Box Count', 'Weight', 'Status', 'Delivered Date & Time',
      ...(isAdmin ? ['Driver'] : []),
    ];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = filtered.map(s => {
      const driverName = (s.lastMessage || '').match(/^Driver:\s*(.+)$/i)?.[1]?.trim() || '';
      return [
        esc(s.dateFormatted),
        esc(s.awb),
        esc(s.custRef),
        esc(s.customer),
        s.boxCount ?? '',
        esc(s.weight),
        esc(s.status),
        esc(s.status === 'Delivered' ? s.lastUpdatedAt : ''),
        ...(isAdmin ? [esc(driverName)] : []),
      ].join(',');
    });
    const csv = [headers.map(esc).join(','), ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shipments-${driver}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [filtered, driver]);

  // Helper: is this shipment visible for the current driver?
  const isVisibleToDriver = (s) => {
    if (driver === 'Admin') return true;
    if (!isInRoute(s)) return false;
    const shipmentDriver = getShipmentDriver(s);
    return !(s.status !== 'InfoReceived' && shipmentDriver && shipmentDriver !== driver);
  };

  const driverFiltered = shipments.filter(isVisibleToDriver);
  const counts = { All: driverFiltered.length };
  STATUSES.forEach(s => { counts[s.key] = driverFiltered.filter(sh => sh.status === s.key).length; });
  counts['Exception'] = driverFiltered.filter(s => s.status === 'Exception').length;
  const pendingCount = driverFiltered.filter(s => s.status !== 'Delivered').length;
  const deliveredCount = counts['Delivered'] || 0;

  // Driver selection
  if (!driver) {
    return (
      <div style={{
        minHeight: '100vh', background: '#faf9f7',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        padding: 24,
      }}>
        <img src="/snitch-logo.png" alt="Snitch" style={{ width: 56, height: 56, marginBottom: 12 }} />
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
          Snitch Self Delivery
        </h1>
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 32 }}>Select your profile to continue</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 280 }}>
          {DRIVERS.filter(n => n !== 'Admin').map(name => (
            <button
              key={name}
              onClick={() => selectDriver(name)}
              style={{
                padding: '16px 20px', borderRadius: 14, border: '1.5px solid #e5e7eb',
                background: '#fff', cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 14,
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: DRIVER_COLORS[name] || '#d97706',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0,
              }}>
                {name[0]}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{name}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>Driver</div>
              </div>
            </button>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            <span style={{ fontSize: 10, color: '#d1d5db', fontWeight: 600, letterSpacing: '0.05em' }}>ADMIN</span>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          </div>
          <button
            onClick={() => selectDriver('Admin')}
            style={{
              padding: '16px 20px', borderRadius: 14, border: '1.5px solid #e0e7ff',
              background: '#f5f3ff', cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 14,
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: '#4f46e5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>A</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Admin</div>
              <div style={{ fontSize: 11, color: '#818cf8' }}>View all · Read only</div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Detail view
  if (detail) {
    const live = shipments.find(s => s.id === detail.id) || detail;
    return (
      <>
        <DetailView shipment={live} onBack={() => setDetail(null)} onUpdate={handleUpdate} onException={handleException} updating={updating} readOnly={driver === 'Admin'} />
        {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
      </>
    );
  }

  // Loading
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#faf9f7',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <img src="/snitch-logo.png" alt="Snitch" style={{ width: 48, height: 48, marginBottom: 16, opacity: 0.6 }} />
        <div style={{ color: '#9ca3af', fontSize: 14 }}>Loading shipments...</div>
      </div>
    );
  }

  const selectionMode = selected.size > 0;

  return (
    <div style={{
      minHeight: '100vh', background: '#faf9f7',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      maxWidth: 480, margin: '0 auto',
      paddingBottom: selectionMode ? 100 : 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px 10px', borderBottom: '1.5px solid #e5e7eb',
        position: 'sticky', top: 0, background: '#faf9f7', zIndex: 10,
      }}>
        {/* Top bar with logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/snitch-logo.png" alt="Snitch" style={{ width: 32, height: 32, borderRadius: 6 }} />
            <div>
              <h1 style={{ fontSize: 15, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>
                {driver}
              </h1>
              <p style={{ fontSize: 10, color: '#9ca3af' }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { localStorage.removeItem('snitch_driver'); setDriver(null); }} title="Switch driver" style={{
              width: 34, height: 34, borderRadius: 9, background: '#fff',
              border: '1.5px solid #e5e7eb', color: '#9ca3af', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
            {driver !== 'Admin' && (
              <button onClick={selectAllInFilter} style={{
                width: 34, height: 34, borderRadius: 9,
                background: selectionMode ? '#dbeafe' : '#fff',
                border: selectionMode ? '1.5px solid #3b82f6' : '1.5px solid #e5e7eb',
                color: selectionMode ? '#2563eb' : '#9ca3af',
                cursor: 'pointer', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>☑</button>
            )}
            <button onClick={() => setShowMore(v => !v)} title="Filters & Export" style={{
              width: 34, height: 34, borderRadius: 9,
              background: (showMore || dateFrom || dateTo) ? '#f3f4f6' : '#fff',
              border: (dateFrom || dateTo) ? '1.5px solid #7c3aed' : '1.5px solid #e5e7eb',
              color: (dateFrom || dateTo) ? '#7c3aed' : '#6b7280',
              cursor: 'pointer', fontSize: 18, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              letterSpacing: '-2px', paddingRight: 2,
            }}>···</button>
            <button
              onClick={() => loadShipments(true)}
              disabled={refreshing}
              style={{
                width: 34, height: 34, borderRadius: 9, background: '#fff',
                border: '1.5px solid #e5e7eb', color: '#9ca3af', cursor: 'pointer', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
              }}
            >↻</button>
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: '8px 10px', border: '1.5px solid #e5e7eb' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{counts.All}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>Total</div>
          </div>
          <div style={{ background: '#fef3c7', borderRadius: 10, padding: '8px 10px', border: '1.5px solid #fde68a' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#b45309' }}>{pendingCount}</div>
            <div style={{ fontSize: 10, color: '#92400e' }}>Pending</div>
          </div>
          <div style={{ background: '#d1fae5', borderRadius: 10, padding: '8px 10px', border: '1.5px solid #a7f3d0' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#047857' }}>{deliveredCount}</div>
            <div style={{ fontSize: 10, color: '#065f46' }}>Delivered</div>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14 }}>🔍</div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search AWB, customer, order ref..."
            style={{
              width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10,
              border: '1.5px solid #e5e7eb', background: '#fff', color: '#111827',
              fontSize: 13, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* More panel: date filter + export */}
        {showMore && (
          <div style={{
            marginBottom: 10, background: '#fff', borderRadius: 12,
            border: '1.5px solid #e5e7eb', padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: -2 }}>Date range</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                style={{
                  flex: 1, padding: '8px 10px', borderRadius: 9,
                  border: '1.5px solid #e5e7eb', background: '#faf9f7',
                  color: dateFrom ? '#111827' : '#9ca3af', fontSize: 12, outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <span style={{ color: '#9ca3af', fontSize: 11, flexShrink: 0 }}>to</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                style={{
                  flex: 1, padding: '8px 10px', borderRadius: 9,
                  border: '1.5px solid #e5e7eb', background: '#faf9f7',
                  color: dateTo ? '#111827' : '#9ca3af', fontSize: 12, outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => { setDateFrom(''); setDateTo(''); }}
                  style={{
                    padding: '8px 10px', borderRadius: 9, border: '1.5px solid #fecaca',
                    background: '#fee2e2', color: '#dc2626', fontSize: 11,
                    cursor: 'pointer', flexShrink: 0, fontWeight: 600,
                  }}
                >Clear</button>
              )}
            </div>
            <button
              onClick={() => { downloadCSV(); setShowMore(false); }}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 9,
                background: '#111827', color: '#fff', border: 'none',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download CSV · {filtered.length} shipments
            </button>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 3, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { key: 'All', label: 'All', short: 'All', color: '#6b7280', pill: '#e5e7eb' },
            ...STATUSES,
            EXCEPTION_STATUS,
          ].map(tab => {
            const isActive = filter === tab.key;
            const c = counts[tab.key] || 0;
            return (
              <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
                padding: '5px 10px', borderRadius: 8, border: 'none',
                background: isActive ? tab.pill : 'transparent',
                color: isActive ? tab.color : '#9ca3af',
                fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                transition: 'all 0.15s',
              }}>
                {tab.short}
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  background: isActive ? `${tab.color}15` : '#f3f4f6',
                  color: isActive ? tab.color : '#9ca3af',
                  padding: '1px 5px', borderRadius: 8,
                }}>{c}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shipment list */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {error && (
          <div style={{
            background: '#fee2e2', border: '1.5px solid #fecaca', borderRadius: 10,
            padding: '12px 14px', color: '#991b1b', fontSize: 13,
          }}>
            Failed to load: {error}.
            <button onClick={() => loadShipments()} style={{
              marginLeft: 8, color: '#dc2626', background: 'none', border: 'none',
              textDecoration: 'underline', cursor: 'pointer', fontSize: 13,
            }}>Retry</button>
          </div>
        )}

        {filtered.length === 0 && !error ? (
          <div style={{ textAlign: 'center', padding: '40px 24px', color: '#9ca3af' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>No shipments found</div>
          </div>
        ) : (
          filtered.map(s => (
            <ShipmentRow
              key={s.id}
              shipment={s}
              isSelected={selected.has(s.id)}
              onToggle={toggleSelect}
              onSelect={setDetail}
              selectionMode={selectionMode}
              readOnly={driver === 'Admin'}
              driverTag={driver === 'Admin' ? getShipmentDriver(s) : null}
            />
          ))
        )}
      </div>

      {selectionMode && driver !== 'Admin' && (
        <BulkActionBar
          selected={selected}
          shipments={shipments}
          onUpdate={handleUpdate}
          onClear={() => setSelected(new Set())}
          updating={updating}
        />
      )}

      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
