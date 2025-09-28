import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { firebaseAuth } from '../utils/firebase';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

export default function AuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Đang xử lý xác thực...');

  useEffect(() => {
    const completeFirebaseEmailLink = async () => {
      try {
        if (isSignInWithEmailLink(firebaseAuth, window.location.href)) {
          setMessage('Đang xác thực email với Firebase...');
          let email = window.localStorage.getItem('emailForSignIn');
          let username = window.localStorage.getItem('usernameForSignIn');

          if (!email) {
            email = window.prompt('Nhập email đã dùng để đăng ký:');
          }
          if (!username) {
            username = (email && email.includes('@')) ? email.split('@')[0] : 'user_' + Date.now();
          }

          const cred = await signInWithEmailLink(firebaseAuth, email, window.location.href);
          const idToken = await cred.user.getIdToken();

          const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          const baseUrl = isLocal ? 'http://localhost:3001' : '';

          const resp = await axios.post(`${baseUrl}/auth/firebase-register`, {
            email,
            username,
            firebaseIdToken: idToken,
          });

          // Clear temp
          window.localStorage.removeItem('emailForSignIn');
          window.localStorage.removeItem('usernameForSignIn');

          // Nếu cần chờ duyệt
          if (resp.data?.needsApproval) {
            setMessage('Đăng ký thành công! Vui lòng chờ admin duyệt tài khoản.');
            setTimeout(() => navigate('/login'), 2000);
            return;
          }

          // Nếu không cần duyệt, lưu token và điều hướng theo role
          if (resp.data?.token && resp.data?.user) {
            localStorage.setItem('token', resp.data.token);
            localStorage.setItem('role', resp.data.user.role || 'khach-hang');
            localStorage.setItem('username', resp.data.user.username || username);
            const tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('tabId', tabId);
            redirectBasedOnRole(resp.data.user.role || 'khach-hang');
            return;
          }

          // Fallback nếu không có token trả về
          setMessage('Hoàn tất xác thực. Vui lòng đăng nhập.');
          setTimeout(() => navigate('/login'), 1500);
          return;
        }
      } catch (e) {
        console.error('❌ [Firebase Email Link] Error:', e);
        navigate('/login?error=firebase_email_link_failed');
        return;
      }

      // Không phải email-link → xử lý SSO (giữ logic cũ)
      const token = searchParams.get('token');
      const username = searchParams.get('username');
      const role = searchParams.get('role');
      const error = searchParams.get('error');

      if (error) {
        console.error('❌ [SSO] Auth error:', error);
        navigate('/login?error=sso_failed');
        return;
      }

      if (!token || !username || !role) {
        console.error('❌ [SSO] Missing auth parameters');
        navigate('/login?error=invalid_callback');
        return;
      }

      const tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('username', username);
      localStorage.setItem('tabId', tabId);
      console.log('✅ [SSO] Auth successful:', { username, role });
      redirectBasedOnRole(role);
    };

    completeFirebaseEmailLink();
  }, [searchParams, navigate]);

  const redirectBasedOnRole = (role) => {
    switch (role) {
      case 'admin':
        window.location.href = '/admin';
        break;
      case 'ban-giam-doc':
        window.location.href = '/bgd';
        break;
      case 'quan-tri-tin-dung':
        window.location.href = '/qttd-nhan-ban-giao';
        break;
      case 'quan-ly-giao-dich':
      case 'quan-ly-khach-hang':
        window.location.href = '/customer-manager';
        break;
      default:
        window.location.href = '/';
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(120deg, #7f53ac 0%, #647dee 50%, #fc5c7d 100%)',
      color: 'white',
      fontFamily: 'Montserrat, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid white',
          borderTop: '3px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <h2>Đang xử lý...</h2>
        <p>{message}</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
} 