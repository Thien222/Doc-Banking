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
import NotificationProvider from './components/NotificationProvider';
import AuthSuccess from './components/AuthSuccess';


function App() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username');
  const [showChat, setShowChat] = useState(false);
  const [socket, setSocket] = useState(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  // Tự động kết nối socket khi đăng nhập
  useEffect(() => {
    if (token && username && role) {
      // Auto detect môi trường cho Socket.IO
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const socketUrl = isLocal ? 'http://localhost:3001' : '/';
      const newSocket = io(socketUrl, { path: '/socket.io' });
      setSocket(newSocket);

      // Tự động join chat khi đăng nhập
      newSocket.emit('join-chat', {
        username: username,
        role: role
      });
      
      console.log('🔔 [CLIENT] Joining chat with role:', role);

      newSocket.on('connect', () => {

      });
      newSocket.on('disconnect', () => {

      });
      newSocket.on('connect_error', (err) => {
        console.error('❌ Socket connect error:', err);
      });
      newSocket.on('reconnect', (attempt) => {

      });

      // Listen for new messages to update unread count
      newSocket.on('private-message', (message) => {
        if (message.from !== username) {
          setTotalUnreadCount(prev => prev + 1);
        }
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
      <NotificationProvider socket={socket}>
      <Routes>
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/auth-success" element={<AuthSuccess />} />
        <Route path="/admin" element={token && role === 'admin' ? <AdminPage /> : <Navigate to="/login" />} />
        <Route path="/bgd" element={token && role === 'ban-giam-doc' ? <BGDPage /> : <Navigate to="/login" />} />
        <Route path="/customer-manager" element={token ? <CustomerManagerPage /> : <Navigate to="/login" />} />
        <Route path="/qlkh-ban-giao" element={token ? (role === 'quan-ly-khach-hang' ? <QLKHBanGiaoPage /> : <NoAccess expectedRole="quan-ly-khach-hang" />) : <Navigate to="/login" />} />
        <Route path="/qlkh-nhan-chung-tu" element={token ? (role === 'quan-ly-khach-hang' ? <QLKHNhanChungTuPage /> : <NoAccess expectedRole="quan-ly-khach-hang" />) : <Navigate to="/login" />} />
        <Route path="/qttd-nhan-ban-giao" element={token ? ((role === 'quan-tri-tin-dung' || role === 'ban-giam-doc') ? <QTTDNhanBanGiaoPage /> : <NoAccess expectedRole="quan-tri-tin-dung hoặc ban-giam-doc" />) : <Navigate to="/login" />} />
        <Route path="/qttd-hoan-tra" element={token ? ((role === 'quan-tri-tin-dung' || role === 'ban-giam-doc') ? <QTTDHoanTraPage /> : <NoAccess expectedRole="quan-tri-tin-dung hoặc ban-giam-doc" />) : <Navigate to="/login" />} />
        <Route path="/financial-dashboard" element={token ? (role === 'quan-tri-tin-dung' ? <FinancialDashboard /> : <NoAccess expectedRole="quan-tri-tin-dung" />) : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
        {/* Nút chat nổi, chỉ hiện khi đã đăng nhập */}
        {token && (
          <>
            <div style={{ position: 'relative' }}>
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
              {totalUnreadCount > 0 && (
                <div style={{
                  position: 'fixed',
                  bottom: 70,
                  right: 30,
                  zIndex: 2001,
                  background: '#ff4757',
                  color: 'white',
                  borderRadius: '50%',
                  minWidth: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  padding: '0 4px',
                  boxShadow: '0 2px 8px rgba(255, 71, 87, 0.4)',
                  animation: 'pulse 2s infinite'
                }}>
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </div>
              )}
            </div>
            <Chat 
              isOpen={showChat} 
              onClose={() => {
                setShowChat(false);
                setTotalUnreadCount(0); // Reset count when chat is opened
              }} 
              socket={socket} 
            />
          </>
        )}
      </NotificationProvider>
    </Router>
  );
}

export default App;
