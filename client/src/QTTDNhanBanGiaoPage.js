import React, { useEffect, useState } from "react";
import "./AdminPage.css"; // Sử dụng style đồng bộ
import { useNavigate } from 'react-router-dom';

function QTTDNhanBanGiaoPage() {
  const [hoSos, setHoSos] = useState([]);
  const [selectedHoSo, setSelectedHoSo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState(""); // "accept" or "reject"
  const [note, setNote] = useState("");
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  // Lấy danh sách hồ sơ chờ QTTD nhận
  useEffect(() => {
    fetch("/hoso/cho-qttd-nhan")
      .then((res) => res.json())
      .then((data) => setHoSos(data))
      .catch((err) => alert("Lỗi tải hồ sơ!"));
  }, []);

  // Xử lý đồng ý/từ chối
  const handleAction = (hoso, act) => {
    setSelectedHoSo(hoso);
    setAction(act);
    setShowModal(true);
  };

  // Xác nhận thao tác
  const handleConfirm = () => {
    const user = localStorage.getItem('username') || '';
    const url =
      action === "accept"
        ? `/hoso/${selectedHoSo._id}/nhan`
        : `/hoso/${selectedHoSo._id}/tu-choi`;
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: action === "accept"
        ? JSON.stringify({ user })
        : JSON.stringify({ note, user }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Lỗi cập nhật!");
        setHoSos((prev) => prev.filter((h) => h._id !== selectedHoSo._id));
        setShowModal(false);
        setNote("");
        setSelectedHoSo(null);
        if (action === "accept") {
          navigate('/qttd-hoan-tra');
        }
      })
      .catch(() => alert("Lỗi thao tác!"));
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--magnetic-bg)',
      fontFamily: 'var(--magnetic-font)',
      transition: 'all 0.3s ease',
      position: 'relative',
      paddingBottom: 40
    }}>
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        title={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'var(--magnetic-card-bg)',
          border: '2px solid var(--border-color)',
          borderRadius: '50px',
          padding: '12px',
          cursor: 'pointer',
          boxShadow: 'var(--magnetic-shadow)',
          transition: 'all 0.3s ease',
          zIndex: 1000,
          fontSize: '1.2rem',
          color: 'var(--text-primary)'
        }}
        onMouseOver={e => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 12px 40px rgba(168, 85, 247, 0.3)';
        }}
        onMouseOut={e => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = 'var(--magnetic-shadow)';
        }}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
      {/* Logout Button */}
      <button
        onClick={handleLogout}
        title="Đăng xuất"
        style={{
          position: 'fixed',
          top: '20px',
          right: '80px',
          background: 'var(--magnetic-card-bg)',
          border: '2px solid var(--border-color)',
          borderRadius: '50px',
          padding: '12px',
          cursor: 'pointer',
          boxShadow: 'var(--magnetic-shadow)',
          transition: 'all 0.3s ease',
          zIndex: 1000,
          fontSize: '1.2rem',
          color: 'var(--text-primary)'
        }}
        onMouseOver={e => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 12px 40px rgba(229, 62, 62, 0.3)';
        }}
        onMouseOut={e => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = 'var(--magnetic-shadow)';
        }}
      >
        🚪
      </button>
      <div className="main-content">
        <div className="users-section">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>QTTD nhận bàn giao</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                style={{
                  background: 'linear-gradient(90deg, var(--magnetic-primary), var(--magnetic-accent))',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 16,
                  padding: '10px 24px',
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(127,83,172,0.12)',
                  transition: 'all 0.2s'
                }}
                onClick={() => navigate('/qttd-hoan-tra')}
                onMouseOver={e => { e.target.style.transform = 'scale(1.07)'; e.target.style.boxShadow = '0 8px 32px rgba(127,83,172,0.18)'; }}
                onMouseOut={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 4px 16px rgba(127,83,172,0.12)'; }}
              >
                Chuyển sang hoàn trả hồ sơ
              </button>
              <button
                style={{
                  background: 'linear-gradient(90deg, #28a745, #20c997)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 16,
                  padding: '10px 24px',
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(40,167,69,0.12)',
                  transition: 'all 0.2s'
                }}
                onClick={() => navigate('/financial-dashboard')}
                onMouseOver={e => { e.target.style.transform = 'scale(1.07)'; e.target.style.boxShadow = '0 8px 32px rgba(40,167,69,0.18)'; }}
                onMouseOut={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 4px 16px rgba(40,167,69,0.12)'; }}
              >
                📊 Dashboard Tài Chính
              </button>
            </div>
          </div>
          <table className="users-table">
            <thead>
              <tr>
                <th>Mã hồ sơ</th>
                <th>Khách hàng</th>
                <th>Ngày bàn giao</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {hoSos.length === 0 ? (
                <tr>
                  <td colSpan={5}>Không có hồ sơ chờ nhận</td>
                </tr>
              ) : (
                hoSos.map((hoso) => (
                  <tr key={hoso._id}>
                    <td>{hoso.maHoSo || hoso.soTaiKhoan || ""}</td>
                    <td>{hoso.tenKhachHang}</td>
                    <td>{hoso.ngayBanGiao ? hoso.ngayBanGiao.slice(0, 10) : ""}</td>
                    <td>
                      <span className={`status-badge status-${hoso.trangThai}`}>{hoso.trangThai}</span>
                    </td>
                    <td>
                      <button className="action-btn edit-btn" onClick={() => handleAction(hoso, "accept")}>Đồng ý</button>
                      <button className="action-btn delete-btn" onClick={() => handleAction(hoso, "reject")}>Từ chối</button>
                      <button className="action-btn" onClick={() => setSelectedHoSo(hoso)}>Xem chi tiết</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Modal xác nhận và xem chi tiết giữ nguyên như cũ */}
          {showModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: 'var(--card-bg)', borderRadius: 32, boxShadow: '0 16px 48px rgba(127,83,172,0.18), 0 2px 16px rgba(100,125,222,0.10)', padding: '40px 36px 32px 36px', minWidth: 380, maxWidth: 440, border: '1.5px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
                  <span style={{ fontSize: 28, color: 'var(--danger-color)' }}>{action === 'accept' ? '✅' : '❌'}</span>
                  <h3 style={{ textAlign: 'center', margin: 0, fontSize: 26, fontWeight: 800, background: 'linear-gradient(90deg, var(--magnetic-primary), var(--magnetic-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 1 }}>
                    {action === "accept" ? "Xác nhận nhận hồ sơ?" : "Nhập lý do từ chối"}
                  </h3>
                </div>
                {action === "reject" && (
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Nhập lý do từ chối"
                    style={{ width: "100%", border: '1.5px solid var(--border-color)', borderRadius: 16, padding: 14, minHeight: 70, marginBottom: 24, fontSize: 16, outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box', resize: 'vertical', color: 'var(--text-primary)', background: 'var(--input-bg)' }}
                    onFocus={e => e.target.style.border = '2px solid var(--magnetic-primary)'}
                    onBlur={e => e.target.style.border = '1.5px solid var(--border-color)'}
                  />
                )}
                <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 10 }}>
                  <button style={{ background: 'linear-gradient(90deg, var(--magnetic-primary), var(--magnetic-accent))', color: '#fff', border: 'none', borderRadius: 16, padding: '10px 36px', fontWeight: 700, fontSize: 17, cursor: 'pointer', boxShadow: '0 4px 16px rgba(127,83,172,0.12)', transition: 'all 0.2s' }}
                    onMouseOver={e => { e.target.style.transform = 'scale(1.07)'; e.target.style.boxShadow = '0 8px 32px rgba(127,83,172,0.18)'; }}
                    onMouseOut={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 4px 16px rgba(127,83,172,0.12)'; }}
                    onClick={handleConfirm}>
                    Xác nhận
                  </button>
                  <button style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1.5px solid var(--border-color)', borderRadius: 16, padding: '10px 36px', fontWeight: 700, fontSize: 17, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={e => { e.target.style.background = 'var(--bg-primary)'; e.target.style.transform = 'scale(1.04)'; }}
                    onMouseOut={e => { e.target.style.background = 'var(--bg-secondary)'; e.target.style.transform = 'scale(1)'; }}
                    onClick={() => setShowModal(false)}>
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          )}
          {selectedHoSo && !showModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: 'var(--card-bg)', borderRadius: 32, boxShadow: '0 16px 48px rgba(127,83,172,0.18), 0 2px 16px rgba(100,125,222,0.10)', padding: '40px 36px 32px 36px', minWidth: 380, maxWidth: 440, border: '1.5px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
                  <span style={{ fontSize: 28, color: 'var(--magnetic-primary)' }}>📄</span>
                  <h3 style={{ textAlign: 'center', margin: 0, fontSize: 26, fontWeight: 800, background: 'linear-gradient(90deg, var(--magnetic-primary), var(--magnetic-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 1 }}>Chi tiết hồ sơ</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 10, columnGap: 18, fontSize: 16 }}>
                  <div style={{ color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border-color)', padding: '4px 0' }}>Số tài khoản:</div>
                  <div style={{ fontWeight: 700, borderBottom: '1px solid var(--border-color)', padding: '4px 0' }}>{selectedHoSo.soTaiKhoan || '-'}</div>
                  <div style={{ color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border-color)', padding: '4px 0' }}>CIF:</div>
                  <div style={{ fontWeight: 700, borderBottom: '1px solid var(--border-color)', padding: '4px 0' }}>{selectedHoSo.cif || '-'}</div>
                  <div style={{ color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border-color)', padding: '4px 0' }}>Tên khách hàng:</div>
                  <div style={{ fontWeight: 700, borderBottom: '1px solid var(--border-color)', padding: '4px 0' }}>{selectedHoSo.tenKhachHang || '-'}</div>
                  <div style={{ color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border-color)', padding: '4px 0' }}>Số tiền giải ngân:</div>
                  <div style={{ fontWeight: 700, borderBottom: '1px solid var(--border-color)', padding: '4px 0' }}>{selectedHoSo.soTienGiaiNgan?.toLocaleString() || '-'}</div>
                  <div style={{ color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border-color)', padding: '4px 0' }}>Loại tiền:</div>
                  <div style={{ fontWeight: 700, borderBottom: '1px solid var(--border-color)', padding: '4px 0' }}>{selectedHoSo.loaiTien || '-'}</div>
                  <div style={{ color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border-color)', padding: '4px 0' }}>Ngày giải ngân:</div>
                  <div style={{ fontWeight: 700, borderBottom: '1px solid var(--border-color)', padding: '4px 0' }}>{selectedHoSo.ngayGiaiNgan ? new Date(selectedHoSo.ngayGiaiNgan).toLocaleDateString() : '-'}</div>
                  <div style={{ color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border-color)', padding: '4px 0' }}>Trạng thái:</div>
                  <div style={{ fontWeight: 700, borderBottom: '1px solid var(--border-color)', padding: '4px 0' }}>{selectedHoSo.trangThai || '-'}</div>
                  <div style={{ color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border-color)', padding: '4px 0' }}>Phòng:</div>
                  <div style={{ fontWeight: 700, borderBottom: '1px solid var(--border-color)', padding: '4px 0' }}>{selectedHoSo.phong || '-'}</div>
                  <div style={{ color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border-color)', padding: '4px 0' }}>QLKH:</div>
                  <div style={{ fontWeight: 700, borderBottom: '1px solid var(--border-color)', padding: '4px 0' }}>{selectedHoSo.qlkh || '-'}</div>
                  <div style={{ color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border-color)', padding: '4px 0' }}>Hợp đồng:</div>
                  <div style={{ fontWeight: 700, borderBottom: '1px solid var(--border-color)', padding: '4px 0' }}>{selectedHoSo.hopDong || '-'}</div>
                  <div style={{ color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border-color)', padding: '4px 0' }}>Ghi chú:</div>
                  <div style={{ fontWeight: 700, borderBottom: '1px solid var(--border-color)', padding: '4px 0' }}>{selectedHoSo.ghiChu || '-'}</div>
                  <div style={{ color: 'var(--text-secondary)', fontWeight: 600, padding: '4px 0' }}>Ngày tạo:</div>
                  <div style={{ fontWeight: 700, padding: '4px 0' }}>{selectedHoSo.createdAt ? new Date(selectedHoSo.createdAt).toLocaleString() : '-'}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
                  <button style={{ background: 'linear-gradient(90deg, var(--magnetic-primary), var(--magnetic-accent))', color: '#fff', border: 'none', borderRadius: 16, padding: '10px 36px', fontWeight: 700, fontSize: 17, cursor: 'pointer', boxShadow: '0 4px 16px rgba(127,83,172,0.12)', transition: 'all 0.2s' }}
                    onMouseOver={e => { e.target.style.transform = 'scale(1.07)'; e.target.style.boxShadow = '0 8px 32px rgba(127,83,172,0.18)'; }}
                    onMouseOut={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 4px 16px rgba(127,83,172,0.12)'; }}
                    onClick={() => setSelectedHoSo(null)}>
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QTTDNhanBanGiaoPage; 