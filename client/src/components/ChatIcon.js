import React, { useState, useEffect } from 'react';
import Chat from './Chat';
import io from 'socket.io-client';

const ChatIcon = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const currentUser = {
    username: localStorage.getItem('username'),
    role: localStorage.getItem('role')
  };

  // Khởi tạo socket connection
  useEffect(() => {
    if (!currentUser.username) return;

    const newSocket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('🔌 Chat socket connected');
      setIsConnected(true);
      // Auto join chat khi connect
      newSocket.emit('join-chat', {
        username: currentUser.username,
        role: currentUser.role
      });
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Chat socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setIsConnected(false);
    });

    // Lắng nghe tin nhắn mới để cập nhật badge
    newSocket.on('private-message', (message) => {
      // Chỉ cập nhật nếu không phải tin nhắn của mình và chat đang đóng
      if (message.from !== currentUser.username && !isChatOpen) {
        fetchUnreadCount();
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [currentUser.username, currentUser.role]);

  // Fetch số tin nhắn chưa đọc
  const fetchUnreadCount = async () => {
    if (!currentUser.username) return;
    
    try {
      const response = await fetch(`http://localhost:3001/messages/unread-count?username=${currentUser.username}`);
      const data = await response.json();
      const total = data.reduce((sum, item) => sum + item.count, 0);
      setTotalUnreadCount(total);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Fetch unread count khi component mount và định kỳ
  useEffect(() => {
    fetchUnreadCount();
    
    // Fetch mỗi 30 giây để đảm bảo sync
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [currentUser.username]);

  // Reset unread count khi mở chat
  useEffect(() => {
    if (isChatOpen) {
      // Delay một chút để đảm bảo chat đã load xong
      setTimeout(() => {
        fetchUnreadCount();
      }, 1000);
    }
  }, [isChatOpen]);

  // Ẩn hiện icon dựa trên scroll (optional)
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    
    // Reset badge khi mở chat
    if (!isChatOpen) {
      setTimeout(() => {
        setTotalUnreadCount(0);
      }, 1000);
    }
  };

  // Không hiển thị nếu chưa đăng nhập
  if (!currentUser.username) {
    return null;
  }

  return (
    <>
      {/* Chat Icon */}
      <div
        onClick={toggleChat}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: isChatOpen 
            ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
            : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
          boxShadow: isVisible 
            ? '0 8px 32px rgba(14, 165, 233, 0.3)' 
            : '0 4px 16px rgba(14, 165, 233, 0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          color: 'white',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(100px) scale(0.8)',
          opacity: isVisible ? 1 : 0.7,
          zIndex: 999,
          border: '3px solid white',
          position: 'relative',
          overflow: 'visible'
        }}
        onMouseOver={(e) => {
          if (isVisible) {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.1)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(14, 165, 233, 0.4)';
          }
        }}
        onMouseOut={(e) => {
          if (isVisible) {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(14, 165, 233, 0.3)';
          }
        }}
        title={isChatOpen ? 'Đóng chat' : 'Mở chat'}
      >
        {/* Icon */}
        <div style={{
          transition: 'transform 0.2s ease',
          transform: isChatOpen ? 'rotate(45deg)' : 'rotate(0deg)'
        }}>
          {isChatOpen ? '✖️' : '💬'}
        </div>

        {/* Connection Status Indicator */}
        <div style={{
          position: 'absolute',
          top: '-2px',
          left: '-2px',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: isConnected ? '#10b981' : '#ef4444',
          border: '2px solid white',
          animation: isConnected ? 'none' : 'pulse 2s infinite'
        }} />

        {/* Unread Messages Badge */}
        {totalUnreadCount > 0 && !isChatOpen && (
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            minWidth: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
            animation: 'bounce 2s infinite'
          }}>
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </div>
        )}

        {/* Pulse Ring Effect */}
        {totalUnreadCount > 0 && !isChatOpen && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '2px solid #ef4444',
            transform: 'translate(-50%, -50%)',
            animation: 'ping 2s infinite',
            opacity: 0.6
          }} />
        )}
      </div>

      {/* Chat Component */}
      <Chat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        socket={socket}
      />

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0,0,0);
          }
          40%, 43% {
            transform: translate3d(0,-8px,0);
          }
          70% {
            transform: translate3d(0,-4px,0);
          }
          90% {
            transform: translate3d(0,-2px,0);
          }
        }
        
        @keyframes ping {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
          75%, 100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </>
  );
};

export default ChatIcon;