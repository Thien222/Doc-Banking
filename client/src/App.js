import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';
import AdminPage from './AdminPage';
import CustomerManagerPage from './CustomerManagerPage';
import BGDPage from './BGDPage';
import QLKHBanGiaoPage from './QLKHBanGiaoPage';
import QTTDNhanBanGiaoPage from './QTTDNhanBanGiaoPage';
import QTTDHoanTraPage from './QTTDHoanTraPage';
import QLKHNhanChungTuPage from './QLKHNhanChungTuPage';
import FinancialDashboard from './FinancialDashboard';
import Chat from './components/Chat';

function App() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username');
  const [showChat, setShowChat] = useState(false);
  const [socket, setSocket] = useState(null);

  // Tự động kết nối socket khi đăng nhập
  useEffect(() => {
    if (token && username && role) {
      const newSocket = io('http://localhost:3000');
      setSocket(newSocket);

      // Tự động join chat khi đăng nhập
      newSocket.emit('join-chat', {
        username: username,
        role: role
      });

      return () => {
        newSocket.close();
      };
    }
  }, [token, username, role]);

  console.log('App.js token:', token, 'role:', role);

  // Helper component để debug quyền truy cập
  function NoAccess({ expectedRole }) {
    return <div style={{color:'red',textAlign:'center',marginTop:40}}>
      Không có quyền truy cập!<br/>
      <b>Role hiện tại:</b> {role || 'Không xác định'}<br/>
      <b>Yêu cầu:</b> {expectedRole}
    </div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/admin" element={token && role === 'admin' ? <AdminPage /> : <Navigate to="/login" />} />
        <Route path="/bgd" element={token && role === 'ban-giam-doc' ? <BGDPage /> : <Navigate to="/login" />} />
        <Route path="/customer-manager" element={token ? <CustomerManagerPage /> : <Navigate to="/login" />} />
        <Route path="/qlkh-ban-giao" element={token ? (role === 'quan-ly-khach-hang' ? <QLKHBanGiaoPage /> : <NoAccess expectedRole="quan-ly-khach-hang" />) : <Navigate to="/login" />} />
        <Route path="/qlkh-nhan-chung-tu" element={token ? (role === 'quan-ly-khach-hang' ? <QLKHNhanChungTuPage /> : <NoAccess expectedRole="quan-ly-khach-hang" />) : <Navigate to="/login" />} />
        <Route path="/qttd-nhan-ban-giao" element={token ? (role === 'quan-tri-tin-dung' ? <QTTDNhanBanGiaoPage /> : <NoAccess expectedRole="quan-tri-tin-dung" />) : <Navigate to="/login" />} />
        <Route path="/qttd-hoan-tra" element={token ? (role === 'quan-tri-tin-dung' ? <QTTDHoanTraPage /> : <NoAccess expectedRole="quan-tri-tin-dung" />) : <Navigate to="/login" />} />
        <Route path="/financial-dashboard" element={token ? (role === 'quan-tri-tin-dung' ? <FinancialDashboard /> : <NoAccess expectedRole="quan-tri-tin-dung" />) : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      {/* Nút chat nổi, chỉ hiện khi đã đăng nhập */}
      {token && (
        <>
          <button
            onClick={() => setShowChat(true)}
            style={{
              position: 'fixed',
              bottom: 30,
              right: 30,
              zIndex: 2000,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: 56,
              height: 56,
              fontSize: 28,
              boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
              cursor: 'pointer',
              display: showChat ? 'none' : 'block'
            }}
            title="Chat nội bộ"
          >
            💬
          </button>
          <Chat isOpen={showChat} onClose={() => setShowChat(false)} socket={socket} />
        </>
      )}
    </Router>
  );
}

export default App;
