import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';
import AdminPage from './AdminPage';
import Dashboard from './Dashboard';
import CustomerManagerPage from './CustomerManagerPage';
import BGDPage from './BGDPage';
import QLKHBanGiaoPage from './QLKHBanGiaoPage';
import QTTDNhanBanGiaoPage from './QTTDNhanBanGiaoPage';
import QTTDHoanTraPage from './QTTDHoanTraPage';
import QLKHNhanChungTuPage from './QLKHNhanChungTuPage';
import FinancialDashboard from './FinancialDashboard';

function App() {
  // Kiểm tra trạng thái đăng nhập (token, role) từ localStorage
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
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
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/qlkh-ban-giao" element={token ? (role === 'quan-ly-khach-hang' ? <QLKHBanGiaoPage /> : <NoAccess expectedRole="quan-ly-khach-hang" />) : <Navigate to="/login" />} />
        <Route path="/qlkh-nhan-chung-tu" element={token ? (role === 'quan-ly-khach-hang' ? <QLKHNhanChungTuPage /> : <NoAccess expectedRole="quan-ly-khach-hang" />) : <Navigate to="/login" />} />
        <Route path="/qttd-nhan-ban-giao" element={token ? (role === 'quan-tri-tin-dung' ? <QTTDNhanBanGiaoPage /> : <NoAccess expectedRole="quan-tri-tin-dung" />) : <Navigate to="/login" />} />
        <Route path="/qttd-hoan-tra" element={token ? (role === 'quan-tri-tin-dung' ? <QTTDHoanTraPage /> : <NoAccess expectedRole="quan-tri-tin-dung" />) : <Navigate to="/login" />} />
        <Route path="/financial-dashboard" element={token ? (role === 'quan-tri-tin-dung' ? <FinancialDashboard /> : <NoAccess expectedRole="quan-tri-tin-dung" />) : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
