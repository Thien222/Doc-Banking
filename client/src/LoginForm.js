import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import './AuthForm.css';

export default function LoginForm() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [msg, setMsg] = useState('');
  const [ssoStatus, setSsoStatus] = useState({ google: { enabled: false } });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check SSO status on component mount
  useEffect(() => {
    checkSsoStatus();
  }, []);

  // Handle SSO success callback
  useEffect(() => {
    const token = searchParams.get('token');
    const username = searchParams.get('username');
    const role = searchParams.get('role');
    const error = searchParams.get('error');

    if (error === 'sso_failed') {
      setMsg('SSO đăng nhập thất bại. Vui lòng thử lại.');
      return;
    }

    if (token && username && role) {
      // Add tab ID to prevent conflicts
      const tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('username', username);
      localStorage.setItem('tabId', tabId);
      
      console.log('✅ [SSO] Login successful:', { username, role });
      
      // Redirect based on role
      redirectBasedOnRole(role);
    }
  }, [searchParams, navigate]);

  const checkSsoStatus = async () => {
    try {
      // Tự động detect môi trường
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isLocal ? 'http://localhost:3001' : '';
      const response = await axios.get(`${baseUrl}/sso/status`);
      setSsoStatus(response.data);
    } catch (error) {
      console.error('❌ [SSO] Failed to check SSO status:', error);
      // Set default SSO status if API fails
      setSsoStatus({ google: { enabled: false } });
    }
  };

  const redirectBasedOnRole = (role) => {
    if (role === 'admin') {
      window.location.href = '/admin';
    } else if (role === 'ban-giam-doc') {
      window.location.href = '/bgd';
    } else if (role === 'quan-tri-tin-dung') {
      window.location.href = '/qttd-nhan-ban-giao';
    } else if (role === 'quan-ly-giao-dich') {
      window.location.href = '/customer-manager';
    } else if (role === 'quan-ly-khach-hang') {
      window.location.href = '/customer-manager';
    } else {
      window.location.href = '/';
    }
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg('');
    try {
      // Tự động detect môi trường
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isLocal ? 'http://localhost:3001' : '';
      const res = await axios.post(`${baseUrl}/auth/login`, form);
      
      // Add tab ID to prevent conflicts
      const tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.user.role);
      localStorage.setItem('username', res.data.user.username || form.username);
      localStorage.setItem('tabId', tabId);
      
      // Redirect based on role
      redirectBasedOnRole(res.data.user.role);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Lỗi đăng nhập');
    }
  };

  const handleGoogleSSO = () => {
    if (!ssoStatus.google || !ssoStatus.google.enabled) {
      setMsg('Google SSO chưa được cấu hình');
      return;
    }
    
    console.log('🔐 [SSO] Redirecting to Google OAuth...');
    // Tự động detect môi trường
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isLocal ? 'http://localhost:3001' : '';
    window.location.href = `${baseUrl}/sso/google`;
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Đăng nhập</h2>
        
        {/* Local Login Form */}
        <input 
          name="username" 
          placeholder="Tên đăng nhập" 
          value={form.username} 
          onChange={handleChange} 
          required 
        />
        <input 
          name="password" 
          type="password" 
          placeholder="Mật khẩu" 
          value={form.password} 
          onChange={handleChange} 
          required 
        />
        
        {/* Login Buttons */}
        <div className="button-container">
          {ssoStatus.google && ssoStatus.google.enabled && (
            <button 
              type="button" 
              className="sso-button google-sso"
              onClick={handleGoogleSSO}
            >
              <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" />
              Google
            </button>
          )}
          <button type="submit">Đăng nhập</button>
        </div>
        
        <p className="auth-link">
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
        
        {msg && <p className="auth-msg">{msg}</p>}
      </form>
    </div>
  );
} 