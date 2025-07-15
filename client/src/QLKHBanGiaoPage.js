import React from 'react';

export default function QLKHBanGiaoPage() {
  return (
    <div style={{ padding: 32, maxWidth: 600, margin: '40px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px #eee' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Hồ sơ QLKH bàn giao</h2>
      <form>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label><input type="checkbox" /> Đề xuất giải ngân/BL</label>
          <label><input type="checkbox" /> HĐTD / Đề nghị BL</label>
          <label><input type="checkbox" /> UNC</label>
          <label><input type="checkbox" /> Hóa đơn giải ngân</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" /> Khác:
            <input type="text" style={{ flex: 1, border: '1px solid #ccc', borderRadius: 6, padding: 4 }} placeholder="..." />
          </label>
        </div>
        <div style={{ margin: '24px 0 12px 0', display: 'flex', gap: 16, alignItems: 'center' }}>
          <button type="button" style={{ background: '#e2e8f0', border: '1px solid #888', borderRadius: 8, padding: '8px 24px', fontWeight: 600 }}>Bàn giao</button>
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <label>Ngày:<br /><input type="date" style={{ width: '100%', border: '1px solid #ccc', borderRadius: 6, padding: 4 }} /></label>
          </div>
          <div style={{ flex: 1 }}>
            <label>User:<br /><input type="text" style={{ width: '100%', border: '1px solid #ccc', borderRadius: 6, padding: 4 }} /></label>
          </div>
        </div>
        <div>
          <label>Ghi chú:<br /><input type="text" style={{ width: '100%', border: '1px solid #ccc', borderRadius: 6, padding: 4 }} /></label>
        </div>
      </form>
    </div>
  );
} 