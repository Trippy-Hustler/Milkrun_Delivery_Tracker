'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchShipments, updateStatus, bulkUpdateStatus } from './api';
import { STATUSES, STATUS_MAP, getNextStatus, EXCEPTION_STATUS } from './statuses';
import Toast from './components/Toast';
import BulkActionBar from './components/BulkActionBar';
import ShipmentRow from './components/ShipmentRow';
import DetailView from './components/DetailView';

export default function App() {
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

  useEffect(() => { loadShipments(); }, [loadShipments]);

  const handleUpdate = useCallback(async (shipmentsToUpdate, newStatus) => {
    setUpdating(true);
    let result;
    if (shipmentsToUpdate.length === 1) {
      const s = shipmentsToUpdate[0];
      result = await updateStatus(s.id, newStatus, s.weight);
    } else {
      result = await bulkUpdateStatus(
        shipmentsToUpdate.map(s => ({ order_id: s.id, status: newStatus, weight: s.weight }))
      );
    }
    if (result.success) {
      const ids = new Set(shipmentsToUpdate.map(s => s.id));
      setShipments(prev => prev.map(s => ids.has(s.id) ? { ...s, status: newStatus } : s));
      if (detail && ids.has(detail.id)) setDetail(prev => prev ? { ...prev, status: newStatus } : null);
      setSelected(new Set());
      const label = STATUS_MAP[newStatus]?.label || newStatus;
      showToast(shipmentsToUpdate.length === 1
        ? `${shipmentsToUpdate[0].awb} → ${label}`
        : `${shipmentsToUpdate.length} shipments → ${label}`);
    } else {
      showToast(result.error || 'Update failed', 'error');
    }
    setUpdating(false);
  }, [detail, showToast]);

  const handleException = useCallback(async (shipment) => {
    setUpdating(true);
    const result = await updateStatus(shipment.id, 'Exception', shipment.weight);
    if (result.success) {
      setShipments(prev => prev.map(s => s.id === shipment.id ? { ...s, status: 'Exception' } : s));
      if (detail?.id === shipment.id) setDetail(prev => prev ? { ...prev, status: 'Exception' } : null);
      showToast(`${shipment.awb} → Exception reported`);
    } else {
      showToast('Failed to report exception', 'error');
    }
    setUpdating(false);
  }, [detail, showToast]);

  const toggleSelect = useCallback((id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAllInFilter = useCallback(() => {
    const filtered = shipments.filter(s => {
      const mf = filter === 'All' || s.status === filter;
      const ms = !search || s.awb?.toLowerCase().includes(search.toLowerCase()) || s.customer?.toLowerCase().includes(search.toLowerCase());
      return mf && ms && s.status !== 'Delivered';
    });
    const allSelected = filtered.length > 0 && filtered.every(s => selected.has(s.id));
    setSelected(allSelected ? new Set() : new Set(filtered.map(s => s.id)));
  }, [shipments, filter, search, selected]);

  const filtered = shipments.filter(s => {
    const mf = filter === 'All' || s.status === filter;
    const ms = !search ||
      s.awb?.toLowerCase().includes(search.toLowerCase()) ||
      s.customer?.toLowerCase().includes(search.toLowerCase()) ||
      s.custRef?.toLowerCase().includes(search.toLowerCase());
    return mf && ms;
  });

  const counts = { All: shipments.length };
  STATUSES.forEach(s => { counts[s.key] = shipments.filter(sh => sh.status === s.key).length; });
  counts['Exception'] = shipments.filter(s => s.status === 'Exception').length;
  const pendingCount = shipments.filter(s => s.status !== 'Delivered').length;
  const deliveredCount = counts['Delivered'] || 0;

  // Detail view
  if (detail) {
    const live = shipments.find(s => s.id === detail.id) || detail;
    return (
      <>
        <DetailView shipment={live} onBack={() => setDetail(null)} onUpdate={handleUpdate} onException={handleException} updating={updating} />
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
                Snitch Self Delivery
              </h1>
              <p style={{ fontSize: 10, color: '#9ca3af' }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={selectAllInFilter} style={{
              width: 34, height: 34, borderRadius: 9,
              background: selectionMode ? '#dbeafe' : '#fff',
              border: selectionMode ? '1.5px solid #3b82f6' : '1.5px solid #e5e7eb',
              color: selectionMode ? '#2563eb' : '#9ca3af',
              cursor: 'pointer', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>☑</button>
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
            />
          ))
        )}
      </div>

      {selectionMode && (
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
