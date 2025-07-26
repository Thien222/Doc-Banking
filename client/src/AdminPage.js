import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPage.css';

const roles = [
  'admin',
  'khach-hang',
  'quan-ly-khach-hang',
  'quan-tri-tin-dung',
  'ban-giam-doc',
  'quan-ly-giao-dich'
];

function isValidObjectId(id) {
  return typeof id === 'string' && id.length === 24 && /^[a-fA-F0-9]+$/.test(id);
}

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', role: 'khach-hang', isActive: true, password: '' });
  const [msg, setMsg] = useState('');
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const getAuthHeader = () => ({ headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });

  const fetchUsers = async () => {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/admin/users`, getAuthHeader());
    const userList = Array.isArray(res.data) ? res.data : res.data.users || [];
    console.log('Fetched users:', userList);
    setUsers(userList);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  const openAdd = () => { setEditUser(null); setForm({ username: '', email: '', role: 'khach-hang', isActive: true, password: '' }); setShowPopup(true); };
  const openEdit = user => { setEditUser(user); setForm({ ...user, password: '' }); setShowPopup(true); };
  const closePopup = () => { setShowPopup(false); setEditUser(null); };

  const handleFormChange = e => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSave = async e => {
    e.preventDefault();
    try {
      if (editUser) {
        // Sửa user: không truyền password nếu không đổi
        const { username, email, role, isActive } = form;
        await axios.put(`${process.env.REACT_APP_API_URL}/admin/users/${editUser._id}`, { email, role, isActive }, getAuthHeader());
        setMsg('Đã cập nhật user!');
      } else {
        // Thêm user: phải có password
        const { username, email, role, isActive, password } = form;
        if (!password) { setMsg('Vui lòng nhập password'); return; }
        await axios.post(`${process.env.REACT_APP_API_URL}/admin/users`, { username, email, role, isActive, password }, getAuthHeader());
        setMsg('Đã thêm user!');
      }
      closePopup();
      fetchUsers();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Lỗi lưu user');
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Bạn có chắc muốn xóa user này?')) return;
            await axios.delete(`${process.env.REACT_APP_API_URL}/admin/users/${id}`, getAuthHeader());
    setMsg('Đã xóa user!');
    fetchUsers();
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const user = users.find(u => u._id === userId);
              await axios.put(`${process.env.REACT_APP_API_URL}/admin/users/${userId}`, { email: user.email, role: newRole, isActive: user.isActive }, getAuthHeader());
      setMsg('Đã cập nhật role!');
      fetchUsers();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Lỗi cập nhật role');
    }
  };

  const handleStatusChange = async (userId, isActive) => {
    try {
      const user = users.find(u => u._id === userId);
      if (!user) {
        setMsg('Không tìm thấy user!');
        return;
      }
      console.log('PUT user:', userId, { email: user.email, role: user.role, isActive });
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/admin/users/${userId}`,
        { email: user.email, role: user.role, isActive },
        getAuthHeader()
      );
      setMsg('Đã cập nhật trạng thái!');
      fetchUsers();
      console.log('PUT response:', res.data);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Lỗi cập nhật trạng thái');
      console.log('Update error:', err.response?.data);
    }
  };

  return (
    <div className="admin-container">
      {/* Theme Toggle Button */}
      <button 
        className="theme-toggle" 
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

      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        <div className="sidebar-nav">
          <div className="nav-item active">
            <span>👥</span>
            <span>Quản lý User</span>
          </div>
          <div className="nav-item">
            <span>📊</span>
            <span>Thống kê</span>
          </div>
          <div className="nav-item">
            <span>⚙️</span>
            <span>Cài đặt</span>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="content-header">
          <h1>Quản lý người dùng</h1>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Tổng số user</h3>
            <div className="number">{Array.isArray(users) ? users.length : 0}</div>
          </div>
          <div className="stat-card">
            <h3>User active</h3>
            <div className="number">{Array.isArray(users) ? users.filter(u => u.isActive).length : 0}</div>
          </div>
          <div className="stat-card">
            <h3>Admin</h3>
            <div className="number">{Array.isArray(users) ? users.filter(u => u.role === 'admin').length : 0}</div>
          </div>
        </div>

        <div className="users-section">
          <div className="section-header">
            <h2>Danh sách người dùng</h2>
            <button className="add-user-btn" onClick={openAdd}>
              ➕ Thêm user
            </button>
          </div>

          <table className="users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(users) && users
                .filter(user => isValidObjectId(user._id))
                .map(user => {
                  const safeRole = roles.includes(user.role) ? user.role : 'khach-hang';
                  return (
                    <tr key={user._id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <select
                          value={safeRole}
                          onChange={(e) => {
                            if (isValidObjectId(user._id)) {
                              handleRoleChange(user._id, e.target.value);
                            } else {
                              setMsg('UserId không hợp lệ, tự động reload lại danh sách!');
                              fetchUsers();
                            }
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--input-bg)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem'
                          }}
                        >
                          {roles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td>
                        <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}</td>
                      <td>
                        <button
                          className="action-btn edit-btn"
                          onClick={() => openEdit(user)}
                          title="Sửa"
                        >✏️</button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => {
                            if (isValidObjectId(user._id)) {
                              handleDelete(user._id);
                            } else {
                              setMsg('UserId không hợp lệ, tự động reload lại danh sách!');
                              fetchUsers();
                            }
                          }}
                          title="Xóa"
                        >🗑️</button>
                        <button
                          className="action-btn"
                          style={{
                            background: user.isActive ? 'var(--danger-color)' : 'var(--success-color)',
                            color: '#fff'
                          }}
                          onClick={() => {
                            if (isValidObjectId(user._id)) {
                              handleStatusChange(user._id, !user.isActive);
                            } else {
                              setMsg('UserId không hợp lệ, tự động reload lại danh sách!');
                              fetchUsers();
                            }
                          }}
                          title={user.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        >
                          {user.isActive ? '🚫' : '✅'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {showPopup && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editUser ? 'Sửa user' : 'Thêm user'}</h3>
              <button className="close-btn" onClick={closePopup}>&times;</button>
            </div>
            <form onSubmit={handleSave} className="user-modal-form">
              <label htmlFor="username">Username</label>
              <input 
                id="username"
                name="username" 
                value={form.username} 
                onChange={handleFormChange} 
                required 
                disabled={!!editUser}
              />
              <label htmlFor="email">Email</label>
              <input 
                id="email"
                name="email" 
                type="email" 
                value={form.email} 
                onChange={handleFormChange} 
                required 
              />
              <label htmlFor="role">Role</label>
              <select id="role" name="role" value={form.role} onChange={handleFormChange}>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <label htmlFor="isActive" style={{marginBottom:0, fontWeight:600}}>Active</label>
              <input 
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={form.isActive}
                onChange={handleFormChange}
              />
              {!editUser && (
                <>
                  <label htmlFor="password">Password</label>
                  <input 
                    id="password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleFormChange}
                    required
                  />
                </>
              )}
              <div className="user-modal-actions">
                <button type="button" className="cancel-btn" onClick={closePopup}>
                  Hủy
                </button>
                <button type="submit" className="save-btn">
                  💾 Lưu
                </button>
              </div>
            </form>
            {msg && <div className="msg-popup">{msg}</div>}
          </div>
        </div>
      )}
      
      <p style={{ 
        color: 'var(--msg-color)', 
        textAlign: 'center', 
        marginTop: '16px',
        fontWeight: '600'
      }}>{msg}</p>
    </div>
  );
} 