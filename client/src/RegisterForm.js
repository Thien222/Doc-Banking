import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './AuthForm.css';

export default function RegisterForm() {
  const [form, setForm] = useState({ username: '', password: '', email: '' });
  const [msg, setMsg] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOTP] = useState('');
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg('');
    try {
              await axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, form);
      setMsg('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.');
      setShowOTP(true);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Lỗi đăng ký');
    }
  };

  const handleVerifyOTP = async e => {
    e.preventDefault();
    setMsg('');
    try {
              await axios.post(`${process.env.REACT_APP_API_URL}/auth/verify-otp`, { email: form.email, otp });
      setMsg('Xác thực email thành công! Bạn có thể đăng nhập sau khi được admin duyệt.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Lỗi xác thực OTP');
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={showOTP ? handleVerifyOTP : handleSubmit}>
        <h2>Đăng ký tài khoản</h2>
        {!showOTP ? (
          <>
            <input name="username" placeholder="Tên đăng nhập" value={form.username} onChange={handleChange} required />
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <input name="password" type="password" placeholder="Mật khẩu" value={form.password} onChange={handleChange} required />
            <button type="submit">Đăng ký</button>
            <p className="auth-link">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
          </>
        ) : (
          <>
            <h3 style={{textAlign:'center',color:'#6a82fb'}}>Xác thực Email</h3>
            <input name="otp" placeholder="Nhập mã OTP" value={otp} onChange={e => setOTP(e.target.value)} required />
            <button type="submit">Xác thực OTP</button>
          </>
        )}
        <p className="auth-msg">{msg}</p>
      </form>
    </div>
  );
} 