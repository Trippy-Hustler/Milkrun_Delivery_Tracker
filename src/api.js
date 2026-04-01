const BASE_URL = process.env.NEXT_PUBLIC_N8N_BASE_URL || 'https://n8n.snitch-workflow.com/webhook';
const FETCH_PATH = process.env.NEXT_PUBLIC_FETCH_SHIPMENTS_PATH || '/get-shipments';
const UPDATE_PATH = process.env.NEXT_PUBLIC_UPDATE_STATUS_PATH || '/update-status';

export async function fetchShipments() {
  try {
    const res = await fetch(`${BASE_URL}${FETCH_PATH}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { success: true, data: Array.isArray(data) ? data : [] };
  } catch (err) {
    console.error('Failed to fetch shipments:', err);
    return { success: false, data: [], error: err.message };
  }
}

export async function updateStatus(orderId, status, weight, driver) {
  try {
    const res = await fetch(`${BASE_URL}${UPDATE_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, status, weight, driver }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function bulkUpdateStatus(updates) {
  try {
    const res = await fetch(`${BASE_URL}${UPDATE_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
