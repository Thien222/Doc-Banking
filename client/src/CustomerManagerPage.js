import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './CustomerManagerPage.css';
import Notification from './components/Notification';

import { useNotification } from './components/NotificationProvider';

// Google Fonts import (chỉ cần 1 lần ở App hoặc index, nhưng thêm ở đây để chắc chắn)
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

const trangThaiOptions = [
  'moi', 
  'dang-xu-ly', 
  'qttd-da-nhan',
  'qttd-tu-choi',
  'qttd-hoan-tra',
  'hoan-tat',
  'hoan-thanh'
];

// Function để hiển thị tên tiếng Việt cho trạng thái
const getTrangThaiLabel = (trangThai) => {
  const labels = {
    'moi': 'Mới',
    'dang-xu-ly': 'Đang xử lý',
    'qttd-da-nhan': 'QTTD đã nhận',
    'qttd-tu-choi': 'QTTD từ chối',
    'qttd-hoan-tra': 'QTTD hoàn trả',
    'hoan-tat': 'Hoàn tất',
    'hoan-thanh': 'Hoàn thành'
  };
  return labels[trangThai] || trangThai;
};



export default function CustomerManagerPage() {
  const [filters, setFilters] = useState({
    soTaiKhoan: '',
    tenKhachHang: '',
    trangThai: '',
    phong: '',
    qlkh: '',
    fromDate: '',
    toDate: ''
  });
  const [hosoList, setHosoList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10); 
  const [showPopup, setShowPopup] = useState(false);
  const [editHoso, setEditHoso] = useState(null);
  const [form, setForm] = useState({
    soTaiKhoan: '', 
    cif: '', 
    tenKhachHang: '', 
    soTienGiaiNgan: '', 
    loaiTien: '', 
    ngayGiaiNgan: '', 
    trangThai: 'moi', 
    phong: '', 
    qlkh: '', 
    hopDong: '', 
    hosoLienQuan: { deXuat: false, hopDong: false, unc: false, hoaDon: false, bienBan: false, khac: '' }
  });
  const [msg, setMsg] = useState('');
  const { lastNotification } = useNotification();
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  // Theme management
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const fetchHoso = useCallback(async (params = {}) => {
    try {
      const currentPage = params.page || page;
      const currentLimit = params.limit || limit;
      
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: currentLimit,
        ...filters,
        ...params
      });
      

      
      // Tự động detect môi trường
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isLocal ? 'http://localhost:3001' : '';
      const response = await axios.get(`${baseUrl}/hoso?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      

      
      setHosoList(response.data.data || []);
      setTotal(response.data.total || 0);
      setPage(currentPage); // Cập nhật page state
      

    } catch (error) {
      console.error('Error fetching hồ sơ:', error);
      setMsg('Lỗi tải hồ sơ!');
      setHosoList([]);
      setTotal(0);
    }
  }, [filters, page, limit]);

  useEffect(() => { 
    setFilters({ soTaiKhoan: '', tenKhachHang: '', trangThai: '', phong: '', qlkh: '', fromDate: '', toDate: '' });
    setPage(1);
    fetchHoso({ page: 1 });
  }, []);

  // Tự động refresh khi nhận notification
  useEffect(() => {
    if (lastNotification) {

      setPage(1);
      // Fetch tất cả records để thấy status mới, không filter theo trạng thái
      fetchHoso({ page: 1, limit: 1000, trangThai: '' }); // Reset trangThai filter
    }
  }, [lastNotification, fetchHoso]);

  // Auto refresh mỗi 30 giây
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHoso();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchHoso]);

  const handleFilterChange = e => setFilters({ ...filters, [e.target.name]: e.target.value });
  const handleSearch = () => { setPage(1); fetchHoso({ page: 1 }); };
  const handleReset = () => { setFilters({ soTaiKhoan: '', tenKhachHang: '', trangThai: '', phong: '', qlkh: '', fromDate: '', toDate: '' }); setPage(1); fetchHoso({ page: 1 }); };

  const openAdd = () => { 
    setEditHoso(null); 
    setForm({ 
      soTaiKhoan: '', 
      cif: '', 
      tenKhachHang: '', 
      soTienGiaiNgan: '', 
      loaiTien: '', 
      ngayGiaiNgan: '', 
      trangThai: 'moi', 
      phong: '', 
      qlkh: '', 
      hopDong: '', 
      hosoLienQuan: { deXuat: false, hopDong: false, unc: false, hoaDon: false, bienBan: false, khac: '' } 
    }); 
    setShowPopup(true); 
  };
  const openEdit = hoso => {
    setEditHoso(hoso);
    setForm({
      ...hoso,
      ngayGiaiNgan: hoso.ngayGiaiNgan ? hoso.ngayGiaiNgan.slice(0,10) : '',
      hosoLienQuan: hoso.hosoLienQuan && typeof hoso.hosoLienQuan === 'object'
        ? {
            deXuat: !!hoso.hosoLienQuan.deXuat,
            hopDong: !!hoso.hosoLienQuan.hopDong,
            unc: !!hoso.hosoLienQuan.unc,
            hoaDon: !!hoso.hosoLienQuan.hoaDon,
            bienBan: !!hoso.hosoLienQuan.bienBan,
            khac: hoso.hosoLienQuan.khac || ''
          }
        : { deXuat: false, hopDong: false, unc: false, hoaDon: false, bienBan: false, khac: '' }
    });
    setShowPopup(true);
  };
  const closePopup = () => { setShowPopup(false); setEditHoso(null); };

  const handleFormChange = e => {
    if (e.target.name.startsWith('hosoLienQuan.')) {
      const key = e.target.name.split('.')[1];
      setForm({ 
        ...form, 
        hosoLienQuan: { 
          ...(form.hosoLienQuan || {}), 
          [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value 
        } 
      });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSave = async e => {
    e.preventDefault();
    try {
      // Chuẩn bị dữ liệu trước khi gửi
      const formData = {
        ...form,
        soTienGiaiNgan: form.soTienGiaiNgan ? Number(form.soTienGiaiNgan) : null,
        ngayGiaiNgan: form.ngayGiaiNgan ? new Date(form.ngayGiaiNgan) : null
      };
      

      
      // Auto detect môi trường (di chuyển ra ngoài để dùng chung)
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isLocal ? 'http://localhost:3001' : '';
      
      if (editHoso) {
        const response = await axios.put(`${baseUrl}/hoso/${editHoso._id}`, formData);
        setMsg('Đã cập nhật hồ sơ!');
      } else {
        const response = await axios.post(`${baseUrl}/hoso`, formData);
        setMsg('Đã thêm hồ sơ!');
      }
      closePopup();
      fetchHoso();
    } catch (err) {
      console.error('Error saving hồ sơ:', err.response?.data || err.message);
      setMsg(`Lỗi lưu hồ sơ: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Bạn có chắc muốn xóa hồ sơ này?')) return;
            // Auto detect môi trường
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const baseUrl = isLocal ? 'http://localhost:3001' : '';
            await axios.delete(`${baseUrl}/hoso/${id}`);
    setMsg('Đã xóa hồ sơ!');
    fetchHoso();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  return (
    <div className="cm-bg">
      {/* Logout Button */}
      <button 
        onClick={handleLogout}
        title="Đăng xuất"
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
        onMouseOver={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 12px 40px rgba(229, 62, 62, 0.3)';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = 'var(--magnetic-shadow)';
        }}
      >
        🚪
      </button>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        padding: '0 20px'
      }}>
        <h2 style={{
          color: 'var(--magnetic-primary)',
          fontFamily: 'Montserrat, Segoe UI, Arial, sans-serif',
          fontWeight: 800,
          fontSize: '2.2rem',
          letterSpacing: '1px',
          margin: 0
        }}>Quản lý hồ sơ khách hàng</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            style={{
              background: 'var(--magnetic-card-bg)',
              border: '2px solid var(--border-color)',
              borderRadius: '50px',
              padding: '12px',
              cursor: 'pointer',
              boxShadow: 'var(--magnetic-shadow)',
              transition: 'all 0.3s ease',
              fontSize: '1.2rem',
              color: 'var(--text-primary)'
            }}
            title="Tài liệu"
            onMouseOver={(e) => {
              e.target.style.transform = 'scale(1.1)';
              e.target.style.boxShadow = '0 12px 40px rgba(139, 69, 19, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = 'var(--magnetic-shadow)';
            }}
          >
            📄
          </button>
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}
            style={{
              background: 'var(--magnetic-card-bg)',
              border: '2px solid var(--border-color)',
              borderRadius: '50px',
              padding: '12px',
              cursor: 'pointer',
              boxShadow: 'var(--magnetic-shadow)',
              transition: 'all 0.3s ease',
              fontSize: '1.2rem',
              color: 'var(--text-primary)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'scale(1.1)';
              e.target.style.boxShadow = '0 12px 40px rgba(168, 85, 247, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = 'var(--magnetic-shadow)';
            }}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
      <div className="cm-filter">
        <input name="soTaiKhoan" placeholder="Số tài khoản" value={filters.soTaiKhoan} onChange={handleFilterChange} />
        <input name="tenKhachHang" placeholder="Tên khách hàng" value={filters.tenKhachHang} onChange={handleFilterChange} />
        <input name="phong" placeholder="Phòng" value={filters.phong} onChange={handleFilterChange} />
        <input name="qlkh" placeholder="QLKH" value={filters.qlkh} onChange={handleFilterChange} />
        <select name="trangThai" value={filters.trangThai} onChange={handleFilterChange}>
          <option value="">Trạng thái</option>
                          {trangThaiOptions.map(t => <option key={t} value={t}>{getTrangThaiLabel(t)}</option>)}
        </select>
        <input name="fromDate" type="date" value={filters.fromDate} onChange={handleFilterChange} />
        <input name="toDate" type="date" value={filters.toDate} onChange={handleFilterChange} />
        <button onClick={handleSearch}><span role="img" aria-label="search">🔍</span> Tìm kiếm</button>
        <button onClick={handleReset}><span role="img" aria-label="reset">♻️</span> Làm mới</button>
        <button onClick={openAdd}><span role="img" aria-label="add">➕</span> Thêm mới</button>
      </div>
      <div className="cm-table-wrap">
        <table className="cm-table">
          <thead>
            <tr>
              <th style={{fontSize:'1.1rem'}}>STT</th>
              <th>Trạng thái</th>
              <th>Số tài khoản</th>
              <th>CIF</th>
              <th>Khách hàng</th>
              <th>Số tiền</th>
              <th>Loại tiền</th>
              <th>Ngày giải ngân</th>
              <th>Phòng</th>
              <th>QLKH</th>
              <th>HĐ</th>
              <th>Hồ sơ liên quan</th>
              <th>Ghi chú & Lý do từ chối</th>
              <th>Hành động</th>
            </tr>
          </thead>
<tbody>
  {hosoList
    .filter(h => !filters.trangThai || h.trangThai === filters.trangThai)
    .map((h, idx) => {
    const hosoLienQuan = h.hosoLienQuan && typeof h.hosoLienQuan === 'object'
      ? h.hosoLienQuan
      : { deXuat: false, hopDong: false, unc: false, hoaDon: false, bienBan: false, khac: '' };
    return (
      <tr key={h._id}>
          <td>{idx + 1}</td>
          <td>{getTrangThaiLabel(h.trangThai)}<span style={{fontSize:'10px',color:'#888'}}> ({h.trangThai})</span></td>
        <td>{h.soTaiKhoan}</td>
        <td>{h.cif}</td>
        <td>{h.tenKhachHang}</td>
        <td>{h.soTienGiaiNgan?.toLocaleString()}</td>
        <td>{h.loaiTien}</td>
        <td>{h.ngayGiaiNgan ? new Date(h.ngayGiaiNgan).toLocaleDateString() : ''}</td>
        <td>{h.phong}</td>
        <td>{h.qlkh}</td>
        <td>{h.hopDong}</td>
        <td>
          {[
            hosoLienQuan.deXuat && '✔️ Đề xuất',
            hosoLienQuan.hopDong && '✔️ HĐTD/ĐN BL',
            hosoLienQuan.unc && '✔️ UNC',
            hosoLienQuan.hoaDon && '✔️ HĐ giải ngân',
            hosoLienQuan.bienBan && '✔️ Biên bản',
            hosoLienQuan.khac && `✔️ Khác: ${hosoLienQuan.khac}`
          ].filter(Boolean).join(', ') || '-'}
        </td>
        <td>
          {h.bgdTuChoi?.lyDo && (
            <div style={{color: '#e53e3e', fontSize: '12px', marginBottom: '4px'}}>
              <strong>BGD từ chối:</strong> {h.bgdTuChoi.lyDo}
            </div>
          )}
          {h.qttdTuChoi?.lyDo && (
            <div style={{color: '#e53e3e', fontSize: '12px', marginBottom: '4px'}}>
              <strong>QTTD từ chối:</strong> {h.qttdTuChoi.lyDo}
            </div>
          )}
          {!h.bgdTuChoi?.lyDo && !h.qttdTuChoi?.lyDo && '-'}
        </td>
        <td>
          <button onClick={() => openEdit(h)} title="Sửa"><span role="img" aria-label="edit">✏️</span></button>
          <button onClick={() => handleDelete(h._id)} title="Xóa"><span role="img" aria-label="delete">🗑️</span></button>
        </td>
      </tr>
    );
  })}
</tbody>
        </table>
        <div className="cm-pagination">
          {Array.from({length: Math.ceil(total/limit)}, (_,i) => (
            <button 
              key={i} 
              className={page===i+1?'active':''} 
              onClick={() => fetchHoso({ page: i+1 })}
            >
              {i+1}
            </button>
          ))}
        </div>
      </div>
      {showPopup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editHoso ? 'Sửa hồ sơ' : 'Thêm hồ sơ'}</h3>
              <button className="modal-close-btn" onClick={closePopup}>&times;</button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-grid">
                <input name="soTaiKhoan" placeholder="Số tài khoản" value={form.soTaiKhoan} onChange={handleFormChange} required />
                <input name="cif" placeholder="CIF" value={form.cif} onChange={handleFormChange} />
                <input name="tenKhachHang" placeholder="Tên khách hàng" value={form.tenKhachHang} onChange={handleFormChange} required />
                <input name="soTienGiaiNgan" placeholder="Số tiền giải ngân" value={form.soTienGiaiNgan} onChange={handleFormChange} type="number" />
                <input name="loaiTien" placeholder="Loại tiền" value={form.loaiTien} onChange={handleFormChange} />
                <input name="ngayGiaiNgan" type="date" value={form.ngayGiaiNgan} onChange={handleFormChange} />
                <input name="trangThai" placeholder="Trạng thái" value={form.trangThai} onChange={handleFormChange} />
                <input name="phong" placeholder="Phòng" value={form.phong} onChange={handleFormChange} />
                <input name="qlkh" placeholder="QLKH" value={form.qlkh} onChange={handleFormChange} />
                <input name="hopDong" placeholder="Hợp đồng" value={form.hopDong} onChange={handleFormChange} />
              </div>
              
              <div className="hoso-lien-quan-wrapper">
                <div className="hoso-lien-quan-header">
                  <span className="modal-icon">📁</span>
                  <span>Hồ sơ/chứng từ đi kèm khi giải ngân:</span>
                </div>
                <div className="hoso-lien-quan-grid">
                  <label>
                    <input type="checkbox" name="hosoLienQuan.deXuat" checked={(form.hosoLienQuan?.deXuat) ?? false} onChange={handleFormChange} disabled={editHoso && !['qlkh'].includes(localStorage.getItem('role'))} />
                    <span>Đề xuất</span>
                  </label>
                  <label>
                    <input type="checkbox" name="hosoLienQuan.hopDong" checked={(form.hosoLienQuan?.hopDong) ?? false} onChange={handleFormChange} disabled={editHoso && !['qlkh'].includes(localStorage.getItem('role'))} />
                    <span>HĐTD/ĐN BL</span>
                  </label>
                  <label>
                    <input type="checkbox" name="hosoLienQuan.unc" checked={(form.hosoLienQuan?.unc) ?? false} onChange={handleFormChange} disabled={editHoso && !['qlkh'].includes(localStorage.getItem('role'))} />
                    <span>UNC</span>
                  </label>
                  <label>
                    <input type="checkbox" name="hosoLienQuan.hoaDon" checked={(form.hosoLienQuan?.hoaDon) ?? false} onChange={handleFormChange} disabled={editHoso && !['qlkh'].includes(localStorage.getItem('role'))} />
                    <span>HĐ giải ngân</span>
                  </label>
                  <label>
                    <input type="checkbox" name="hosoLienQuan.bienBan" checked={(form.hosoLienQuan?.bienBan) ?? false} onChange={handleFormChange} disabled={editHoso && !['qlkh'].includes(localStorage.getItem('role'))} />
                    <span>Biên bản</span>
                  </label>
                  <label>
                    <input type="checkbox" name="hosoLienQuan.khac" checked={!!(form.hosoLienQuan?.khac)} onChange={e => handleFormChange({ target: { name: 'hosoLienQuan.khac', type: 'checkbox', checked: e.target.checked, value: e.target.checked ? (form.hosoLienQuan?.khac || '') : '' } })} disabled={editHoso && !['qlkh'].includes(localStorage.getItem('role'))} />
                    <span>Khác:</span>
                    <input type="text" name="hosoLienQuan.khac" value={form.hosoLienQuan?.khac || ''} onChange={handleFormChange} disabled={!form.hosoLienQuan?.khac || (editHoso && !['qlkh'].includes(localStorage.getItem('role')))} />
                  </label>
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="submit" className="modal-confirm-btn"><span role="img" aria-label="save">💾</span> Lưu</button>
                <button type="button" className="modal-cancel-btn" onClick={closePopup}>Đóng</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <p className="cm-msg">{msg}</p>
      <Notification />
    </div>
  );
} 



