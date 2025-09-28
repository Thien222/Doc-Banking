import React, { useEffect, useState } from 'react';
import './AdminPage.css';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Notification from './components/Notification';
import NotificationTest from './components/NotificationTest';
import { useNotification } from './components/NotificationProvider';
import DigitalSignature from './components/DigitalSignature';

export default function QTTDHoanTraPage() {
  const [hoSos, setHoSos] = useState([]);
  const [selectedHoSo, setSelectedHoSo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState(''); // 'hoantra' | 'detail'
  const [note, setNote] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [showSignature, setShowSignature] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const { lastNotification } = useNotification();
  const navigate = useNavigate();

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

  const handleSignatureSave = (signatureInfo) => {
    setSignatureData(signatureInfo);
    setShowSignature(false);
    console.log('Chữ ký đã được lưu:', signatureInfo);
  };

  // Lấy danh sách hồ sơ QTTD cần hoàn trả
  const fetchHosos = async () => {
    try {
      const token = localStorage.getItem('token');
      // Lấy tất cả hồ sơ liên quan đến QTTD
      // Auto detect môi trường
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isLocal ? 'http://localhost:3001' : '';
      const response = await fetch(`${baseUrl}/hoso`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Hiển thị cả trạng thái qttd-da-nhan và qttd-hoan-tra
      const filtered = (data.data || []).filter(h => h.trangThai === 'qttd-da-nhan' || h.trangThai === 'qttd-hoan-tra' || h.trangThai === 'qttd-tu-choi');
      setHoSos(filtered);
    } catch (err) {
      console.error('Error fetching hồ sơ:', err);
      setHoSos([]);
    }
  };
  
  useEffect(() => {
    fetchHosos();
  }, []);

  // Tự động refresh khi nhận notification
  useEffect(() => {
    if (lastNotification) {
      console.log('🔄 Refreshing data due to notification:', lastNotification);
      fetchHosos();
    }
  }, [lastNotification]);

  // Auto refresh mỗi 30 giây
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 [QTTD Hoan Tra] Auto refresh data...');
      fetchHosos();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const reloadHandler = () => {
      fetchHosos();
    };
    window.addEventListener('qttd-hoantra-reload', reloadHandler);
    return () => {
      window.removeEventListener('qttd-hoantra-reload', reloadHandler);
    };
  }, []);

  // Xử lý hoàn trả/xem chi tiết
  const handleAction = (hoso, act) => {
    setSelectedHoSo(hoso);
    setAction(act);
    setShowModal(true);
  };

  // Hàm sinh PDF xác nhận hoàn trả
  const generatePDF = (hoso) => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'normal');
    
    // Thêm logo BIDV
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 139); // Màu xanh navy
    doc.text('BIDV', 18, 18);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Bank for Investment and Development of Vietnam', 18, 22);
    doc.setTextColor(0, 0, 0); // Reset về màu đen
    
    // Tiêu đề chính
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('BIEN BAN HOAN TRA HO SO GIAI NGAN', 105, 35, { align: 'center' });
    
    // Đường kẻ phân cách
    doc.setDrawColor(0, 0, 139);
    doc.setLineWidth(0.5);
    doc.line(18, 40, 192, 40);
    
    // Thông tin cơ bản
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    let y = 50;
    
    doc.setFont('helvetica', 'bold');
    doc.text('I. THONG TIN KHACH HANG:', 18, y);
    doc.setFont('helvetica', 'normal');
    y += 8;
    doc.text(`• Ten khach hang: ${hoso.tenKhachHang || 'N/A'}`, 22, y);
    y += 6;
    doc.text(`• So tai khoan: ${hoso.soTaiKhoan || 'N/A'}`, 22, y);
    y += 6;
    doc.text(`• So tien giai ngan: ${hoso.soTienGiaiNgan ? hoso.soTienGiaiNgan.toLocaleString('vi-VN') + ' VND' : 'N/A'}`, 22, y);
    y += 6;
    doc.text(`• Ngay giai ngan: ${hoso.ngayGiaiNgan ? new Date(hoso.ngayGiaiNgan).toLocaleDateString('vi-VN') : 'N/A'}`, 22, y);
    y += 6;
    doc.text(`• Phong ban: ${hoso.phong || 'N/A'}`, 22, y);
    y += 6;
    doc.text(`• QLKH phu trach: ${hoso.qlkh || 'N/A'}`, 22, y);
    
    // Danh sách hồ sơ
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('II. DANH SACH HO SO DA HOAN TRA:', 18, y);
    doc.setFont('helvetica', 'normal');
    y += 8;
    
    const checklist = hoso.hosoLienQuan || {};
    const documents = [];
    if (checklist.deXuat) documents.push('De xuat giai ngan/Bao lanh');
    if (checklist.hopDong) documents.push('Hop dong tin dung/De nghi BL');
    if (checklist.unc) documents.push('Uy nhiem chi (UNC)');
    if (checklist.hoaDon) documents.push('Hoa don giai ngan');
    if (checklist.bienBan) documents.push('Bien ban ban giao tai san');
    if (checklist.khac) documents.push(`Khac: ${checklist.khac}`);
    
    documents.forEach((document, index) => {
      doc.text(`• ${document}`, 22, y);
      y += 6;
    });
    
    // Thông tin hoàn trả
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('III. THONG TIN HOAN TRA:', 18, y);
    doc.setFont('helvetica', 'normal');
    y += 8;
    doc.text(`• Ben hoan tra: Quan tri Tin dung (QTTD)`, 22, y);
    y += 6;
    doc.text(`• Ben nhan: Quan ly Khach hang (QLKH)`, 22, y);
    y += 6;
    doc.text(`• Ly do hoan tra: Ho so duoc duyet`, 22, y);
    y += 6;
    doc.text(`• Ngay lap bien ban: ${new Date().toLocaleDateString('vi-VN')}`, 22, y);
    y += 6;
    doc.text(`• Thoi gian: ${new Date().toLocaleTimeString('vi-VN')}`, 22, y);
    
    // Chữ ký
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('IV. CHU KY CAC BEN:', 18, y);
    
    // Đường kẻ nhỏ phân cách
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(18, y + 3, 192, y + 3);
    
    y += 20;
    
    // Thêm chữ ký số vào PDF nếu có
    if (signatureData) {
      try {
        // Thêm chữ ký QTTD
        doc.addImage(signatureData.data, 'PNG', 18, y - 15, 40, 20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Quan tri Tin dung', 25, y + 15);
        
        // Thêm thông tin chữ ký
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Ky boi: ${signatureData.user}`, 18, y + 25);
        doc.text(`Thuc hien: ${signatureData.role}`, 18, y + 30);
        doc.text(`Thoi gian: ${new Date(signatureData.timestamp).toLocaleString('vi-VN')}`, 18, y + 35);
      } catch (error) {
        console.error('Lỗi khi thêm chữ ký vào PDF:', error);
        doc.setFontSize(10);
        doc.text('Quan tri Tin dung: ....................', 18, y);
        doc.text('(Ky, ghi ro ho ten)', 18, y + 8);
      }
    } else {
      doc.setFontSize(10);
      doc.text('Quan tri Tin dung: ....................', 18, y);
      doc.text('(Ky, ghi ro ho ten)', 18, y + 8);
    }
    
    doc.save(`BienBanHoanTra_${hoso.soTaiKhoan || ''}.pdf`);
  };

  // Xác nhận hoàn trả
  const handleConfirm = async () => {
    try {
      console.log('🔄 QTTD hoàn trả hồ sơ:', selectedHoSo.soTaiKhoan);
      
    const user = localStorage.getItem('username') || '';
      const token = localStorage.getItem('token');
      
    // Sinh PDF trước khi gọi API
    if (selectedHoSo) generatePDF(selectedHoSo);
      
      console.log('📤 Sending hoan tra request for:', selectedHoSo._id);
      console.log('📋 Request body:', { user, note });
      
      // Auto detect môi trường
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isLocal ? 'http://localhost:3001' : '';
      const response = await fetch(`${baseUrl}/hoso/${selectedHoSo._id}/hoan-tra`, {
      method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      body: JSON.stringify({ user, note }),
      });
      
      if (!response.ok) {
        throw new Error('Lỗi cập nhật!');
      }
      
      const result = await response.json();
      console.log('✅ Hoan tra completed successfully:', result);
      console.log('🔔 Notification should be sent automatically by server');
      
        setShowModal(false);
        setNote('');
        setSelectedHoSo(null);
      setAction(''); // Reset action
        fetchHosos();
    } catch (error) {
      console.error('❌ Error handling hoan tra:', error);
      alert('Lỗi thao tác: ' + error.message);
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
      {/* Chữ ký Button */}
      <button
        onClick={() => setShowSignature(true)}
        title="Chữ ký số"
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
          e.target.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.3)';
        }}
        onMouseOut={e => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = 'var(--magnetic-shadow)';
        }}
      >
        ✍️
      </button>
      
      {/* Logout Button */}
      <button
        onClick={handleLogout}
        title="Đăng xuất"
        style={{
          position: 'fixed',
          top: '20px',
          right: '140px',
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
            <h2>QTTD hoàn trả hồ sơ</h2>
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
                onClick={() => navigate('/qttd-nhan-ban-giao')}
                onMouseOver={e => { e.target.style.transform = 'scale(1.07)'; e.target.style.boxShadow = '0 8px 32px rgba(127,83,172,0.18)'; }}
                onMouseOut={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 4px 16px rgba(127,83,172,0.12)'; }}
              >
                Chuyển sang nhận bàn giao
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
                <th>Số tài khoản</th>
                <th>Khách hàng</th>
                <th>Ngày giải ngân</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {hoSos.filter(h => ['qttd-da-nhan', 'qttd-hoan-tra', 'qttd-tu-choi'].includes(h.trangThai)).map((hoso, idx) => (
                  <tr key={hoso._id}>
                    <td>{hoso.soTaiKhoan || ''}</td>
                    <td>{hoso.tenKhachHang}</td>
                    <td>{hoso.ngayGiaiNgan ? new Date(hoso.ngayGiaiNgan).toLocaleDateString() : ''}</td>
                    <td>
                      <span className={`status-badge status-${hoso.trangThai}`}>{hoso.trangThai}</span>
                    </td>
                    <td>
                      {hoso.trangThai === 'qttd-da-nhan' && (
                      <button className="action-btn edit-btn" onClick={() => handleAction(hoso, 'hoantra')}>Hoàn trả</button>
                      )}
                      <button className="action-btn" onClick={() => { setSelectedHoSo(hoso); setAction('detail'); setShowModal(true); }}>Xem chi tiết</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          </div>
          {/* Modal xác nhận hoàn trả/chi tiết */}
          {showModal && action === 'hoantra' && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <span className="modal-icon">🔄</span>
                  <h3 className="modal-title">Xác nhận hoàn trả hồ sơ?</h3>
                </div>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Ghi chú (nếu có)"
                  className="modal-textarea"
                  onFocus={e => e.target.style.border = '2px solid var(--magnetic-primary)'}
                  onBlur={e => e.target.style.border = '1.5px solid var(--border-color)'}
                />
                <div className="modal-footer">
                  <button className="modal-confirm-btn" onClick={handleConfirm}>Xác nhận</button>
                  <button className="modal-cancel-btn" onClick={() => { setShowModal(false); setSelectedHoSo(null); setAction(''); setNote(''); }}>Hủy</button>
                </div>
              </div>
            </div>
          )}
          {showModal && action === 'detail' && selectedHoSo && (
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
                <div className="modal-footer">
                  <button className="modal-close-btn" onClick={() => { setShowModal(false); setSelectedHoSo(null); setAction(''); setNote(''); }}>Đóng</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Notification />
      <NotificationTest />
      
      {/* Digital Signature Component */}
      {showSignature && (
        <DigitalSignature
          onSave={handleSignatureSave}
          onCancel={() => setShowSignature(false)}
          title="Chữ ký số - QTTD"
        />
      )}
    </div>
  );
} 