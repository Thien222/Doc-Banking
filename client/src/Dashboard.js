import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const role = localStorage.getItem('role');
  const navigate = useNavigate();
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };
  
  return (
    <div style={{ 
      padding: '32px', 
      background: 'var(--magnetic-bg)', 
      minHeight: '100vh',
      fontFamily: 'var(--magnetic-font)',
      transition: 'all 0.3s ease'
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
        marginBottom: '24px',
        fontSize: '2.2rem',
        fontWeight: 800,
        letterSpacing: '1px',
        textAlign: 'center'
      }}>Dashboard</h2>
      <p style={{ 
        fontSize: '18px', 
        marginBottom: '32px',
        color: 'var(--text-primary)',
        textAlign: 'center'
      }}>
        Chào mừng! Bạn đang đăng nhập với vai trò: <b style={{ color: 'var(--magnetic-accent)' }}>{role}</b>
      </p>
      
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {role === 'admin' && (
          <button 
            onClick={() => navigate('/admin')}
            style={{
              background: 'linear-gradient(135deg, var(--magnetic-primary) 0%, var(--magnetic-accent) 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '16px',
              padding: '20px 32px',
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: 'var(--magnetic-shadow)',
              minWidth: '200px'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-4px) scale(1.05)';
              e.target.style.boxShadow = '0 12px 40px rgba(127,83,172,0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = 'var(--magnetic-shadow)';
            }}
          >
            👥 Quản lý người dùng
          </button>
        )}
        
        <button 
          onClick={() => navigate('/customer-manager')}
          style={{
            background: 'linear-gradient(135deg, var(--magnetic-accent) 0%, var(--magnetic-primary) 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '16px',
            padding: '20px 32px',
            fontSize: '1.1rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: 'var(--magnetic-shadow)',
            minWidth: '200px'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-4px) scale(1.05)';
            e.target.style.boxShadow = '0 12px 40px rgba(127,83,172,0.3)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0) scale(1)';
            e.target.style.boxShadow = 'var(--magnetic-shadow)';
          }}
        >
          📋 Quản lý khách hàng
        </button>
        
        {role === 'quan-tri-tin-dung' && (
          <button 
            onClick={() => navigate('/financial-dashboard')}
            style={{
              background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '16px',
              padding: '20px 32px',
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: 'var(--magnetic-shadow)',
              minWidth: '200px'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-4px) scale(1.05)';
              e.target.style.boxShadow = '0 12px 40px rgba(40,167,69,0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = 'var(--magnetic-shadow)';
            }}
          >
            📊 Dashboard Tài Chính
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        marginTop: '48px',
        maxWidth: '1200px',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: 'var(--magnetic-radius)',
          padding: '24px',
          boxShadow: 'var(--magnetic-shadow)',
          border: '1px solid var(--border-color)',
          transition: 'all 0.3s ease',
          textAlign: 'center'
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'translateY(-4px)';
          e.target.style.boxShadow = '0 12px 40px rgba(127,83,172,0.2)';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'var(--magnetic-shadow)';
        }}
        >
          <h3 style={{
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            fontWeight: 600,
            margin: '0 0 12px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>Tổng số hồ sơ</h3>
          <div style={{
            color: 'var(--magnetic-primary)',
            fontSize: '2.5rem',
            fontWeight: 800,
            margin: '0'
          }}>📊 1,234</div>
        </div>

        <div style={{
          background: 'var(--card-bg)',
          borderRadius: 'var(--magnetic-radius)',
          padding: '24px',
          boxShadow: 'var(--magnetic-shadow)',
          border: '1px solid var(--border-color)',
          transition: 'all 0.3s ease',
          textAlign: 'center'
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'translateY(-4px)';
          e.target.style.boxShadow = '0 12px 40px rgba(127,83,172,0.2)';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'var(--magnetic-shadow)';
        }}
        >
          <h3 style={{
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            fontWeight: 600,
            margin: '0 0 12px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>Đang xử lý</h3>
          <div style={{
            color: 'var(--warning-color)',
            fontSize: '2.5rem',
            fontWeight: 800,
            margin: '0'
          }}>⏳ 89</div>
        </div>

        <div style={{
          background: 'var(--card-bg)',
          borderRadius: 'var(--magnetic-radius)',
          padding: '24px',
          boxShadow: 'var(--magnetic-shadow)',
          border: '1px solid var(--border-color)',
          transition: 'all 0.3s ease',
          textAlign: 'center'
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'translateY(-4px)';
          e.target.style.boxShadow = '0 12px 40px rgba(127,83,172,0.2)';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'var(--magnetic-shadow)';
        }}
        >
          <h3 style={{
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            fontWeight: 600,
            margin: '0 0 12px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>Hoàn thành</h3>
          <div style={{
            color: 'var(--success-color)',
            fontSize: '2.5rem',
            fontWeight: 800,
            margin: '0'
          }}>✅ 1,145</div>
        </div>
      </div>
    </div>
  );
} 