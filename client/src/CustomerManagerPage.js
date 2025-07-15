import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './CustomerManagerPage.css';

// Google Fonts import (chỉ cần 1 lần ở App hoặc index, nhưng thêm ở đây để chắc chắn)
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

const trangThaiOptions = [
  'moi', 'dang-xu-ly', 'hoan-thanh'
];

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
    soTaiKhoan: '', cif: '', tenKhachHang: '', soTienGiaiNgan: '', loaiTien: '', ngayGiaiNgan: '', trangThai: 'moi', phong: '', qlkh: '', hopDong: '', ghiChu: ''
  });
  const [msg, setMsg] = useState('');
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

  const fetchHoso = async (params = {}) => {
    const res = await axios.get('http://localhost:3000/hoso', {
      params: { ...filters, page, limit, ...params }
    });
    setHosoList(res.data.data);
    setTotal(res.data.total);
  };

  useEffect(() => { fetchHoso(); }, [page]);

  const handleFilterChange = e => setFilters({ ...filters, [e.target.name]: e.target.value });
  const handleSearch = () => { setPage(1); fetchHoso({ page: 1 }); };
  const handleReset = () => { setFilters({ soTaiKhoan: '', tenKhachHang: '', trangThai: '', phong: '', qlkh: '', fromDate: '', toDate: '' }); setPage(1); fetchHoso({ page: 1 }); };

  const openAdd = () => { setEditHoso(null); setForm({ soTaiKhoan: '', cif: '', tenKhachHang: '', soTienGiaiNgan: '', loaiTien: '', ngayGiaiNgan: '', trangThai: 'moi', phong: '', qlkh: '', hopDong: '', ghiChu: '' }); setShowPopup(true); };
  const openEdit = hoso => { setEditHoso(hoso); setForm({ ...hoso, ngayGiaiNgan: hoso.ngayGiaiNgan ? hoso.ngayGiaiNgan.slice(0,10) : '' }); setShowPopup(true); };
  const closePopup = () => { setShowPopup(false); setEditHoso(null); };

  const handleFormChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async e => {
    e.preventDefault();
    try {
      if (editHoso) {
        await axios.put(`http://localhost:3000/hoso/${editHoso._id}`, form);
        setMsg('Đã cập nhật hồ sơ!');
      } else {
        await axios.post('http://localhost:3000/hoso', form);
        setMsg('Đã thêm hồ sơ!');
      }
      closePopup();
      fetchHoso();
    } catch (err) {
      setMsg('Lỗi lưu hồ sơ');
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Bạn có chắc muốn xóa hồ sơ này?')) return;
    await axios.delete(`http://localhost:3000/hoso/${id}`);
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
      {/* Theme Toggle Button */}
      <button 
        className="theme-toggle" 
        onClick={toggleTheme}
        title={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}
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

      <h2 style={{
        color: 'var(--magnetic-primary)',
        fontFamily: 'Montserrat, Segoe UI, Arial, sans-serif',
        fontWeight: 800,
        fontSize: '2.2rem',
        letterSpacing: '1px',
        textAlign: 'center',
        marginBottom: 32
      }}>Quản lý hồ sơ khách hàng</h2>
      <div className="cm-filter">
        <input name="soTaiKhoan" placeholder="Số tài khoản" value={filters.soTaiKhoan} onChange={handleFilterChange} />
        <input name="tenKhachHang" placeholder="Tên khách hàng" value={filters.tenKhachHang} onChange={handleFilterChange} />
        <input name="phong" placeholder="Phòng" value={filters.phong} onChange={handleFilterChange} />
        <input name="qlkh" placeholder="QLKH" value={filters.qlkh} onChange={handleFilterChange} />
        <select name="trangThai" value={filters.trangThai} onChange={handleFilterChange}>
          <option value="">Trạng thái</option>
          {trangThaiOptions.map(t => <option key={t} value={t}>{t}</option>)}
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
              <th>Ghi chú</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {hosoList.map((h, idx) => (
              <tr key={h._id}>
                <td>{(page-1)*limit + idx + 1}</td>
                <td>{h.trangThai}</td>
                <td>{h.soTaiKhoan}</td>
                <td>{h.cif}</td>
                <td>{h.tenKhachHang}</td>
                <td>{h.soTienGiaiNgan?.toLocaleString()}</td>
                <td>{h.loaiTien}</td>
                <td>{h.ngayGiaiNgan ? new Date(h.ngayGiaiNgan).toLocaleDateString() : ''}</td>
                <td>{h.phong}</td>
                <td>{h.qlkh}</td>
                <td>{h.hopDong}</td>
                <td>{h.ghiChu}</td>
                <td>
                  <button onClick={() => openEdit(h)} title="Sửa"><span role="img" aria-label="edit">✏️</span></button>
                  <button onClick={() => handleDelete(h._id)} title="Xóa"><span role="img" aria-label="delete">🗑️</span></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="cm-pagination">
          {Array.from({length: Math.ceil(total/limit)}, (_,i) => (
            <button key={i} className={page===i+1?'active':''} onClick={()=>setPage(i+1)}>{i+1}</button>
          ))}
        </div>
      </div>
      {showPopup && (
        <div className="cm-popup">
          <form className="auth-form" onSubmit={handleSave} style={{minWidth:340}}>
            <button className="close-btn" type="button" onClick={closePopup}>&times;</button>
            <h3 style={{
              color: 'var(--magnetic-primary)',
              fontFamily: 'Montserrat, Segoe UI, Arial, sans-serif',
              fontWeight: 800,
              fontSize: '1.5rem',
              letterSpacing: '0.5px',
              marginBottom: 18
            }}>{editHoso ? 'Sửa hồ sơ' : 'Thêm hồ sơ'}</h3>
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
            <input name="ghiChu" placeholder="Ghi chú" value={form.ghiChu} onChange={handleFormChange} />
            <button type="submit"><span role="img" aria-label="save">💾</span> Lưu</button>
          </form>
        </div>
      )}
      <p className="cm-msg">{msg}</p>
    </div>
  );
} 