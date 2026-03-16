import { useEffect } from 'react';

const styles = {
  success: { bg: '#d1fae5', border: '#059669', text: '#047857' },
  error: { bg: '#fee2e2', border: '#dc2626', text: '#991b1b' },
  info: { bg: '#dbeafe', border: '#2563eb', text: '#1e40af' },
};

export default function Toast({ message, type = 'success', onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const s = styles[type] || styles.success;

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      background: s.bg, border: `1.5px solid ${s.border}`, color: s.text,
      padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600,
      zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      display: 'flex', alignItems: 'center', gap: 8, maxWidth: '88vw',
      animation: 'toastIn 0.25s ease-out',
    }}>
      {type === 'success' && '✓'} {message}
    </div>
  );
}
