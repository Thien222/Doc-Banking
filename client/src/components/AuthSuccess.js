import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function AuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
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

    // Add tab ID to prevent conflicts
    const tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Save auth data
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('username', username);
    localStorage.setItem('tabId', tabId);
    
    console.log('✅ [SSO] Auth successful:', { username, role });
    
    // Redirect based on role
    redirectBasedOnRole(role);
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
        <h2>Đăng nhập thành công!</h2>
        <p>Đang chuyển hướng...</p>
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