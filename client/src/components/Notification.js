import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import pushNotificationManager from '../utils/pushNotifications';

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Yêu cầu quyền push notification
    pushNotificationManager.requestPermission();

    // Kết nối Socket.IO
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    // Lấy role từ localStorage
    const role = localStorage.getItem('role');
    
    if (role) {
      // Join room theo role
      newSocket.emit('join-room', role);
      console.log('🔌 Connected to notification room:', role);
    }

    // Lắng nghe notification
    newSocket.on('notification', (notification) => {
      console.log('🔔 Received notification:', notification);
      setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Giữ tối đa 5 notification
      
      // Gửi push notification nếu không focus vào tab
      if (!pushNotificationManager.isTabFocused()) {
        pushNotificationManager.sendHosoNotification(notification.data, notification.type);
      }
      
      // Tự động xóa notification sau 5 giây
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    });

    // Lắng nghe connection events
    newSocket.on('connect', () => {
      console.log('🔌 Socket connected');
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error);
    });

    return () => {
      if (role) {
        newSocket.emit('leave-room', role);
      }
      newSocket.close();
    };
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_hoso':
        return '📄';
      case 'hoso_ban_giao':
        return '📤';
      case 'hoso_tu_choi':
        return '❌';
      case 'hoso_hoan_tra':
        return '📥';
      case 'hoso_completed':
        return '✅';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'new_hoso':
        return '#3b82f6'; // blue
      case 'hoso_ban_giao':
        return '#10b981'; // green
      case 'hoso_tu_choi':
        return '#ef4444'; // red
      case 'hoso_hoan_tra':
        return '#f59e0b'; // amber
      case 'hoso_completed':
        return '#8b5cf6'; // purple
      default:
        return '#6b7280'; // gray
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '400px'
    }}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            border: `2px solid ${getNotificationColor(notification.type)}`,
            animation: 'slideInRight 0.3s ease-out',
            position: 'relative',
            minWidth: '300px'
          }}
        >
          {/* Close button */}
          <button
            onClick={() => removeNotification(notification.id)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.color = '#ef4444'}
            onMouseOut={(e) => e.target.style.color = '#6b7280'}
          >
            ×
          </button>

          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '24px' }}>
              {getNotificationIcon(notification.type)}
            </span>
            <h4 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '700',
              color: getNotificationColor(notification.type)
            }}>
              {notification.title}
            </h4>
          </div>

          {/* Message */}
          <p style={{
            margin: '0 0 8px 0',
            fontSize: '14px',
            color: '#374151',
            lineHeight: '1.4'
          }}>
            {notification.message}
          </p>

          {/* Timestamp */}
          <div style={{
            fontSize: '12px',
            color: '#9ca3af',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>
              {new Date(notification.timestamp).toLocaleTimeString('vi-VN')}
            </span>
            {notification.data?.user && (
              <span style={{ fontStyle: 'italic' }}>
                bởi {notification.data.user}
              </span>
            )}
          </div>

          {/* Progress bar for auto-remove */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '3px',
            background: getNotificationColor(notification.type),
            borderRadius: '0 0 10px 10px',
            animation: 'shrink 5s linear'
          }} />
        </div>
      ))}

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default Notification; 