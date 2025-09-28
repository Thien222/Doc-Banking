import React, { useEffect, useState } from "react";
import "./AdminPage.css"; // Sử dụng style đồng bộ
import { useNavigate } from 'react-router-dom';
import Notification from './components/Notification';
import NotificationTest from './components/NotificationTest';
import { useNotification } from './components/NotificationProvider';

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
  const { lastNotification } = useNotification();
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
  const fetchHoSos = async () => {
    try {
      const token = localStorage.getItem('token');
      // Auto detect môi trường
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isLocal ? 'http://localhost:3001' : '';
      const hosoPath = isLocal ? '/hoso' : '/api/hoso';
      const response = await fetch(`${baseUrl}${hosoPath}/cho-qttd-nhan`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setHoSos(data);
    } catch (err) {
      console.error('Error fetching hồ sơ:', err);
      alert("Lỗi tải hồ sơ: " + err.message);
    }
  };

  useEffect(() => {
    fetchHoSos();
  }, []);

  // Tự động refresh khi nhận notification
  useEffect(() => {
    if (lastNotification) {
      console.log('🔄 Refreshing data due to notification:', lastNotification);
      fetchHoSos();
    }
  }, [lastNotification]);

  // Auto refresh mỗi 30 giây
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 [QTTD] Auto refresh data...');
      fetchHoSos();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Xử lý đồng ý/từ chối
  const handleAction = (hoso, act) => {
    setSelectedHoSo(hoso);
    setAction(act);
    setShowModal(true);
  };

  // Xác nhận thao tác
  const handleConfirm = async () => {
    try {
      console.log('🔄 QTTD handling action:', action, 'for hồ sơ:', selectedHoSo.soTaiKhoan);
      
    const user = localStorage.getItem('username') || '';
      const token = localStorage.getItem('token');
    // Auto detect môi trường
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isLocal ? 'http://localhost:3001' : '';
    const hosoPath = isLocal ? '/hoso' : '/api/hoso';
    const url =
      action === "accept"
          ? `${baseUrl}${hosoPath}/${selectedHoSo._id}/nhan`
          : `${baseUrl}${hosoPath}/${selectedHoSo._id}/qttd-tu-choi`;
      
      console.log('📤 Sending request to:', url);
      console.log('📋 Request body:', action === "accept" ? { user } : { lyDo: note, user });
      
      const response = await fetch(url, {
      method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
      body: action === "accept"
        ? JSON.stringify({ user })
        : JSON.stringify({ lyDo: note, user }),
      });
      
      if (!response.ok) {
        throw new Error("Lỗi cập nhật!");
      }
      
      const result = await response.json();
      console.log('✅ Action completed successfully:', result);
      console.log('🔔 Notification should be sent automatically by server');
      
        setHoSos((prev) => prev.filter((h) => h._id !== selectedHoSo._id));
        setShowModal(false);
        setNote("");
        setSelectedHoSo(null);
        fetchHoSos(); // Refresh dữ liệu sau khi thao tác
        // Trigger reload ở QTTDHoanTraPage nếu có
        if (window.dispatchEvent) {
          window.dispatchEvent(new Event('qttd-hoantra-reload'));
        }
        if (action === "accept") {
          navigate('/qttd-hoan-tra');
        }
    } catch (error) {
      console.error('❌ Error handling action:', error);
      alert("Lỗi thao tác: " + error.message);
    }
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
          <div className="responsive-table-wrapper">
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
                {hoSos.filter(h => h.trangThai === 'dang-xu-ly').map((hoso, idx) => (
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
                        <button className="action-btn" onClick={() => { setSelectedHoSo(hoso); setAction('detail'); setShowModal(true); }}>Xem chi tiết</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {/* Modal xác nhận và xem chi tiết */}
          {showModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                {action === 'detail' ? (
                  // Modal xem chi tiết
                  <>
                <div className="modal-header">
                  <span className="modal-icon">📄</span>
                  <h3 className="modal-title">Chi tiết hồ sơ</h3>
                </div>
                <div className="modal-details">
                  <div className="detail-item">
                    <span className="detail-label">Số tài khoản:</span>
                    <span className="detail-value">{selectedHoSo.soTaiKhoan || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">CIF:</span>
                    <span className="detail-value">{selectedHoSo.cif || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Tên khách hàng:</span>
                    <span className="detail-value">{selectedHoSo.tenKhachHang || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Số tiền giải ngân:</span>
                    <span className="detail-value">{selectedHoSo.soTienGiaiNgan?.toLocaleString() || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Loại tiền:</span>
                    <span className="detail-value">{selectedHoSo.loaiTien || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ngày giải ngân:</span>
                    <span className="detail-value">{selectedHoSo.ngayGiaiNgan ? new Date(selectedHoSo.ngayGiaiNgan).toLocaleDateString() : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Trạng thái:</span>
                    <span className="detail-value">{selectedHoSo.trangThai || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phòng:</span>
                    <span className="detail-value">{selectedHoSo.phong || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">QLKH:</span>
                    <span className="detail-value">{selectedHoSo.qlkh || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Hợp đồng:</span>
                    <span className="detail-value">{selectedHoSo.hopDong || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ghi chú:</span>
                    <span className="detail-value">{selectedHoSo.ghiChu || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ngày tạo:</span>
                    <span className="detail-value">{selectedHoSo.createdAt ? new Date(selectedHoSo.createdAt).toLocaleString() : '-'}</span>
                  </div>
                </div>
                <div className="modal-actions">
                      <button className="modal-cancel-btn" onClick={() => { setShowModal(false); setSelectedHoSo(null); setAction(''); setNote(''); }}>Đóng</button>
                    </div>
                  </>
                ) : (
                  // Modal xác nhận/từ chối
                  <>
                    <div className="modal-header">
                      <span className={`modal-icon ${action === 'accept' ? 'accept' : 'reject'}`}>{action === 'accept' ? '✅' : '❌'}</span>
                      <h3 className="modal-title">{action === "accept" ? "Xác nhận nhận hồ sơ?" : "Nhập lý do từ chối"}</h3>
                    </div>
                    {action === "reject" && (
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Nhập lý do từ chối"
                        className="modal-textarea"
                        onFocus={e => e.target.style.border = '2px solid var(--magnetic-primary)'}
                        onBlur={e => e.target.style.border = '1.5px solid var(--border-color)'}
                      />
                    )}
                    <div className="modal-actions">
                      <button className="modal-confirm-btn" onClick={handleConfirm}>Xác nhận</button>
                      <button className="modal-cancel-btn" onClick={() => { setShowModal(false); setSelectedHoSo(null); setAction(''); setNote(''); }}>Hủy</button>
                </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Notification />
      <NotificationTest />
    </div>
  );
}

export default QTTDNhanBanGiaoPage; 