import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './AuthForm.css';
import { firebaseAuth } from './utils/firebase';
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

export default function RegisterForm() {
  const [form, setForm] = useState({ username: '', password: '', email: '' });
  const [msg, setMsg] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg('');
    try {
      // Tạm dùng traditional register thay vì Firebase để tránh domain issue
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isLocal ? 'http://localhost:3001' : '';
      const response = await axios.post(`${baseUrl}/auth/register`, form);
      setMsg('Đăng ký thành công! Vui lòng đăng nhập.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Lỗi đăng ký');
    }
  };

  useEffect(() => {
    const tryCompleteSignIn = async () => {
      if (isSignInWithEmailLink(firebaseAuth, window.location.href)) {
        try {
          let email = window.localStorage.getItem('emailForSignIn') || form.email;
          if (!email) {
            email = window.prompt('Nhập email đã dùng để đăng ký:');
          }
          const cred = await signInWithEmailLink(firebaseAuth, email, window.location.href);
          const idToken = await cred.user.getIdToken();
          // Gọi backend để tạo user nội bộ và nhận JWT
          // Tự động detect môi trường
          const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          const baseUrl = isLocal ? 'http://localhost:3001' : '';
          const resp = await axios.post(`${baseUrl}/auth/firebase-register`, {
            email,
            username: form.username || email.split('@')[0],
            firebaseIdToken: idToken,
          });
          localStorage.setItem('token', resp.data.token);
          localStorage.setItem('role', resp.data.user?.role || 'khach-hang');
          navigate('/');
        } catch (error) {
          setMsg(error.response?.data?.error || 'Không thể hoàn tất xác thực từ email link');
        }
      }
    };
    tryCompleteSignIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Đăng ký tài khoản</h2>
        {!emailSent ? (
          <>
            <input name="username" placeholder="Tên đăng nhập" value={form.username} onChange={handleChange} required />
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <input name="password" type="password" placeholder="Mật khẩu" value={form.password} onChange={handleChange} required />
            <button type="submit">Đăng ký</button>
            <p className="auth-link">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
          </>
        ) : (
          <>
            <h3 style={{textAlign:'center',color:'#6a82fb'}}>Kiểm tra email để xác thực bằng liên kết</h3>
            <p>Hãy mở email và bấm vào liên kết đăng nhập. Trang sẽ tự hoàn tất khi bạn quay lại từ link.</p>
          </>
        )}
        <p className="auth-msg">{msg}</p>
      </form>
    </div>
  );
} 