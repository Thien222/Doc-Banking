import React, { useEffect, useState } from "react";
import "./AdminPage.css"; // Sử dụng style đồng bộ
import { useNavigate } from 'react-router-dom';
import Notification from './components/Notification';
import { io } from 'socket.io-client';

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
  const [socket, setSocket] = useState(null);
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
  const fetchHoSos = () => {
    fetch("/hoso/cho-qttd-nhan")
      .then((res) => res.json())
      .then((data) => setHoSos(data))
      .catch((err) => alert("Lỗi tải hồ sơ!"));
  };

  useEffect(() => {
    fetchHoSos();
    
    // Kết nối Socket.IO để nhận notification và refresh dữ liệu
    const newSocket = io(process.env.REACT_APP_API_URL);
    setSocket(newSocket);
    
    const role = localStorage.getItem('role');
    if (role) {
      newSocket.emit('join-room', role);
    }
    
    // Lắng nghe notification và refresh dữ liệu ngay lập tức
    newSocket.on('notification', (notification) => {
      console.log('🔔 Received notification, refreshing data...', notification);
      fetchHoSos(); // Refresh dữ liệu ngay khi nhận notification
    });
    
    return () => {
      if (role) {
        newSocket.emit('leave-room', role);
      }
      newSocket.close();
    };
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
        : `/hoso/${selectedHoSo._id}/qttd-tu-choi`;
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: action === "accept"
        ? JSON.stringify({ user })
        : JSON.stringify({ lyDo: note, user }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Lỗi cập nhật!");
        setHoSos((prev) => prev.filter((h) => h._id !== selectedHoSo._id));
        setShowModal(false);
        setNote("");
        setSelectedHoSo(null);
        fetchHoSos(); // Refresh dữ liệu sau khi thao tác
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
          </div>
          {/* Modal xác nhận và xem chi tiết giữ nguyên như cũ */}
          {showModal && (
            <div className="modal-overlay">
              <div className="modal-content">
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
                  <button className="modal-cancel-btn" onClick={() => setShowModal(false)}>Hủy</button>
                </div>
              </div>
            </div>
          )}
          {selectedHoSo && !showModal && (
            <div className="modal-overlay">
              <div className="modal-content">
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
                  <button className="modal-confirm-btn" onClick={() => setSelectedHoSo(null)}>Đóng</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Notification />
    </div>
  );
}

export default QTTDNhanBanGiaoPage; 