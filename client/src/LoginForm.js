import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './AuthForm.css';

export default function LoginForm() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.user.role);
      localStorage.setItem('username', res.data.user.username || form.username);
      if (res.data.user.role === 'admin') {
        window.location.href = '/admin';
      } else if (res.data.user.role === 'ban-giam-doc') {
        window.location.href = '/bgd';
      } else if (res.data.user.role === 'quan-tri-tin-dung') {
        window.location.href = '/qttd-nhan-ban-giao';
      } else if (res.data.user.role === 'quan-ly-giao-dich') {
        window.location.href = '/customer-manager';
      } else if (res.data.user.role === 'quan-ly-khach-hang') {
        window.location.href = '/customer-manager';
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      setMsg(err.response?.data?.error || 'Lỗi đăng nhập');
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Đăng nhập</h2>
        <input name="username" placeholder="Tên đăng nhập" value={form.username} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Mật khẩu" value={form.password} onChange={handleChange} required />
        <button type="submit">Đăng nhập</button>
        <p className="auth-link">Chưa có tài khoản? <Link to="/register">Đăng ký</Link></p>
        <p className="auth-msg">{msg}</p>
      </form>
    </div>
  );
} 