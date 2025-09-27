import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminPage.css';
import Notification from './components/Notification';
import NotificationTest from './components/NotificationTest';
import { useNotification } from './components/NotificationProvider';

export default function QLKHBanGiaoPage() {
  const [hosoList, setHosoList] = useState([]);
  const [selectedHoso, setSelectedHoso] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState(''); // 'ban-giao' | 'detail'
  const [banGiaoData, setBanGiaoData] = useState({
    ngayBanGiao: '',
    user: '',
    ghiChu: '',
    hosoChecklist: {
      deXuat: false,
      hopDong: false,
      unc: false,
      hoaDon: false,
      bienBan: false,
      khac: ''
    }
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const { lastNotification } = useNotification();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  // Lấy danh sách hồ sơ QLKH có thể bàn giao
  const fetchHoso = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/hoso', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: { trangThai: 'moi' }
      });
      setHosoList(response.data.data || []);
    } catch (error) {
      console.error('Error fetching hồ sơ:', error);
      setHosoList([]);
    }
  };

  useEffect(() => {
    fetchHoso();
  }, []);

  // Tự động refresh khi nhận notification
  useEffect(() => {
    if (lastNotification) {
      console.log('🔄 Refreshing data due to notification:', lastNotification);
      fetchHoso();
    }
  }, [lastNotification]);

  // Auto refresh mỗi 30 giây
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 [QLKH Ban Giao] Auto refresh data...');
      fetchHoso();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Xử lý bàn giao/xem chi tiết
  const handleAction = (hoso, act) => {
    setSelectedHoso(hoso);
    setAction(act);
    if (act === 'ban-giao') {
      setBanGiaoData({
        ngayBanGiao: new Date().toISOString().slice(0, 10),
        user: localStorage.getItem('username') || '',
        ghiChu: '',
        hosoChecklist: {
          deXuat: !!(hoso.hosoLienQuan?.deXuat),
          hopDong: !!(hoso.hosoLienQuan?.hopDong),
          unc: !!(hoso.hosoLienQuan?.unc),
          hoaDon: !!(hoso.hosoLienQuan?.hoaDon),
          bienBan: !!(hoso.hosoLienQuan?.bienBan),
          khac: hoso.hosoLienQuan?.khac || ''
        }
      });
    }
    setShowModal(true);
  };

  // Xác nhận bàn giao
  const handleBanGiao = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:3001/hoso/${selectedHoso._id}/ban-giao`, {
        user: banGiaoData.user,
        ngayBanGiao: banGiaoData.ngayBanGiao,
        ghiChu: banGiaoData.ghiChu,
        hosoLienQuan: banGiaoData.hosoChecklist
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Bàn giao thành công:', response.data);
      setShowModal(false);
      setSelectedHoso(null);
      setAction('');
      fetchHoso();
      alert('Bàn giao hồ sơ thành công!');
    } catch (error) {
      console.error('❌ Error bàn giao:', error);
      alert('Lỗi bàn giao: ' + error.message);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.startsWith('hosoChecklist.')) {
      const key = field.split('.')[1];
      setBanGiaoData(prev => ({
        ...prev,
        hosoChecklist: {
          ...prev.hosoChecklist,
          [key]: value
        }
      }));
    } else {
      setBanGiaoData(prev => ({
        ...prev,
        [field]: value
      }));
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
          <div className="section-header">
            <h2>QLKH Bàn giao hồ sơ</h2>
          </div>
          <div className="responsive-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Số tài khoản</th>
                  <th>Khách hàng</th>
                  <th>Số tiền</th>
                  <th>Ngày giải ngân</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {hosoList.length === 0 ? (
                  <tr>
                    <td colSpan={6}>Không có hồ sơ để bàn giao</td>
                  </tr>
                ) : (
                  hosoList.map((hoso) => (
                    <tr key={hoso._id}>
                      <td>{hoso.soTaiKhoan || ''}</td>
                      <td>{hoso.tenKhachHang}</td>
                      <td>{hoso.soTienGiaiNgan?.toLocaleString() || ''}</td>
                      <td>{hoso.ngayGiaiNgan ? new Date(hoso.ngayGiaiNgan).toLocaleDateString() : ''}</td>
                      <td>
                        <span className={`status-badge status-${hoso.trangThai}`}>{hoso.trangThai}</span>
                      </td>
                      <td>
                        <button className="action-btn edit-btn" onClick={() => handleAction(hoso, 'ban-giao')}>Bàn giao</button>
                        <button className="action-btn" onClick={() => handleAction(hoso, 'detail')}>Xem chi tiết</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Modal bàn giao */}
          {showModal && action === 'ban-giao' && selectedHoso && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <span className="modal-icon">📤</span>
                  <h3 className="modal-title">Bàn giao hồ sơ</h3>
                </div>
                <div className="modal-form">
                  <div className="form-row">
                    <label>Ngày bàn giao:</label>
                    <input
                      type="date"
                      value={banGiaoData.ngayBanGiao}
                      onChange={(e) => handleInputChange('ngayBanGiao', e.target.value)}
                      className="modal-input"
                    />
                  </div>
                  <div className="form-row">
                    <label>User:</label>
                    <input
                      type="text"
                      value={banGiaoData.user}
                      onChange={(e) => handleInputChange('user', e.target.value)}
                      className="modal-input"
                    />
                  </div>
                  <div className="form-row">
                    <label>Ghi chú:</label>
                    <textarea
                      value={banGiaoData.ghiChu}
                      onChange={(e) => handleInputChange('ghiChu', e.target.value)}
                      className="modal-textarea"
                      placeholder="Nhập ghi chú..."
                    />
                  </div>
                  
                  <div className="hoso-checklist">
                    <h4>Hồ sơ/chứng từ đi kèm:</h4>
                    <div className="checklist-grid">
                      <label>
                        <input
                          type="checkbox"
                          checked={banGiaoData.hosoChecklist.deXuat}
                          onChange={(e) => handleInputChange('hosoChecklist.deXuat', e.target.checked)}
                        />
                        Đề xuất giải ngân/BL
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={banGiaoData.hosoChecklist.hopDong}
                          onChange={(e) => handleInputChange('hosoChecklist.hopDong', e.target.checked)}
                        />
                        HĐTD / Đề nghị BL
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={banGiaoData.hosoChecklist.unc}
                          onChange={(e) => handleInputChange('hosoChecklist.unc', e.target.checked)}
                        />
                        UNC
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={banGiaoData.hosoChecklist.hoaDon}
                          onChange={(e) => handleInputChange('hosoChecklist.hoaDon', e.target.checked)}
                        />
                        Hóa đơn giải ngân
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={banGiaoData.hosoChecklist.bienBan}
                          onChange={(e) => handleInputChange('hosoChecklist.bienBan', e.target.checked)}
                        />
                        Biên bản
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={!!banGiaoData.hosoChecklist.khac}
                          onChange={(e) => handleInputChange('hosoChecklist.khac', e.target.checked ? (banGiaoData.hosoChecklist.khac || '') : '')}
                        />
                        Khác:
                        <input
                          type="text"
                          value={banGiaoData.hosoChecklist.khac}
                          onChange={(e) => handleInputChange('hosoChecklist.khac', e.target.value)}
                          className="modal-input"
                          disabled={!banGiaoData.hosoChecklist.khac}
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="modal-confirm-btn" onClick={handleBanGiao}>Bàn giao</button>
                  <button className="modal-cancel-btn" onClick={() => { setShowModal(false); setSelectedHoso(null); setAction(''); }}>Hủy</button>
                </div>
              </div>
            </div>
          )}

          {/* Modal xem chi tiết */}
          {showModal && action === 'detail' && selectedHoso && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <span className="modal-icon">📄</span>
                  <h3 className="modal-title">Chi tiết hồ sơ</h3>
                </div>
                <div className="modal-details">
                  <div className="detail-row">
                    <span className="detail-label">Số tài khoản:</span>
                    <span className="detail-value">{selectedHoso.soTaiKhoan || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">CIF:</span>
                    <span className="detail-value">{selectedHoso.cif || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Tên khách hàng:</span>
                    <span className="detail-value">{selectedHoso.tenKhachHang || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Số tiền giải ngân:</span>
                    <span className="detail-value">{selectedHoso.soTienGiaiNgan?.toLocaleString() || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Loại tiền:</span>
                    <span className="detail-value">{selectedHoso.loaiTien || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Ngày giải ngân:</span>
                    <span className="detail-value">{selectedHoso.ngayGiaiNgan ? new Date(selectedHoso.ngayGiaiNgan).toLocaleDateString() : '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Trạng thái:</span>
                    <span className="detail-value">{selectedHoso.trangThai || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phòng:</span>
                    <span className="detail-value">{selectedHoso.phong || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">QLKH:</span>
                    <span className="detail-value">{selectedHoso.qlkh || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Hợp đồng:</span>
                    <span className="detail-value">{selectedHoso.hopDong || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Ghi chú:</span>
                    <span className="detail-value">{selectedHoso.ghiChu || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Ngày tạo:</span>
                    <span className="detail-value">{selectedHoso.createdAt ? new Date(selectedHoso.createdAt).toLocaleString() : '-'}</span>
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="modal-cancel-btn" onClick={() => { setShowModal(false); setSelectedHoso(null); setAction(''); }}>Đóng</button>
                </div>
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