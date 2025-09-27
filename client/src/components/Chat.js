import React, { useState, useEffect, useRef } from 'react';
import pushNotificationManager from '../utils/pushNotifications';

const Chat = ({ isOpen, onClose, socket }) => {
  // State management
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  
  // Current user info
  const currentUser = {
    username: localStorage.getItem('username'),
    role: localStorage.getItem('role')
  };
  
  // Refs
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedUser]);

  // Socket connection monitoring
  useEffect(() => {
    if (!socket) {
      setSocketStatus('disconnected');
      return;
    }

    const handleConnect = () => {
      console.log('✅ [Chat] Socket connected');
      setSocketStatus('connected');
      setError(null);
    };

    const handleDisconnect = () => {
      console.log('❌ [Chat] Socket disconnected');
      setSocketStatus('disconnected');
    };

    const handleConnectError = (err) => {
      console.error('❌ [Chat] Socket connect error:', err);
      setSocketStatus('error');
      setError('Không thể kết nối chat server');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    setSocketStatus(socket.connected ? 'connected' : 'disconnected');

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, [socket]);

  // Load users and unread counts when chat opens
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);
    
    // Load users
    fetch('http://localhost:3001/users/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(users => {
        // Filter out current user
        const filteredUsers = users.filter(u => 
          u && u.username && u.username !== currentUser.username
        );
        console.log('👥 [Chat] Loaded users:', filteredUsers);
        setUsers(filteredUsers);
        
        // Load unread counts for all users
        return fetch(`http://localhost:3001/messages/unread-count?username=${currentUser.username}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      })
      .then(res => res.json())
      .then(unreadData => {
        const counts = {};
        unreadData.forEach(item => {
          counts[item._id] = item.count;
        });
        console.log('📬 [Chat] Unread counts:', counts);
        setUnreadCounts(counts);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ [Chat] Error loading data:', err);
        setError('Không thể tải dữ liệu');
        setUsers([]);
        setLoading(false);
      });
  }, [isOpen, currentUser.username]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || socketStatus !== 'connected') return;

    // Online users update
    const handleOnlineUsers = (onlineUsernames) => {
      console.log('👥 [Chat] Online users:', onlineUsernames);
      const filteredOnline = onlineUsernames.filter(username => username !== currentUser.username);
      setOnlineUsers(filteredOnline);
    };

    // New message received
    const handleNewMessage = (message) => {
      console.log('💬 [Chat] New message:', message);
      
      // Determine conversation partner
      const partner = message.from === currentUser.username ? message.to : message.from;
      
      setMessages(prev => {
        const conversation = prev[partner] || [];
        const updatedConversation = [...conversation, message];
        
        // Keep only last 50 messages
        if (updatedConversation.length > 50) {
          updatedConversation.splice(0, updatedConversation.length - 50);
        }
        
        return {
          ...prev,
          [partner]: updatedConversation
        };
      });

      // Update unread count if message is from someone else
      if (message.from !== currentUser.username) {
        setUnreadCounts(prev => ({
          ...prev,
          [message.from]: (prev[message.from] || 0) + 1
        }));
      }

      // Play notification sound if not focused
      if (!pushNotificationManager.isTabFocused()) {
        pushNotificationManager.sendChatNotification(message);
        playNotificationSound();
      }
    };

    // Chat history loaded
    const handleChatHistory = ({ room, messages: historyMessages }) => {
      console.log('📜 [Chat] Chat history for room:', room);
      const roomUsers = room.replace('private_', '').split('_');
      const partner = roomUsers.find(user => user !== currentUser.username);
      
      if (partner) {
        setMessages(prev => ({
          ...prev,
          [partner]: historyMessages
        }));
      }
    };

    socket.on('users-online', handleOnlineUsers);
    socket.on('private-message', handleNewMessage);
    socket.on('chat-history', handleChatHistory);

    // Request online users
    socket.emit('request-online-users');

    return () => {
      socket.off('users-online', handleOnlineUsers);
      socket.off('private-message', handleNewMessage);
      socket.off('chat-history', handleChatHistory);
    };
  }, [socket, socketStatus, currentUser.username]);

  // Join private room when user is selected
  useEffect(() => {
    if (!socket || !selectedUser || socketStatus !== 'connected') return;

    console.log('💬 [Chat] Joining room with:', selectedUser.username);
    socket.emit('join-private-room', { toUsername: selectedUser.username });

    // Mark messages as read
    if (unreadCounts[selectedUser.username] > 0) {
      fetch('http://localhost:3001/messages/mark-read', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          from: selectedUser.username, 
          to: currentUser.username 
        })
      }).then(() => {
        setUnreadCounts(prev => ({ ...prev, [selectedUser.username]: 0 }));
      }).catch(err => {
        console.error('❌ [Chat] Error marking as read:', err);
      });
    }

    return () => {
      console.log('🚪 [Chat] Leaving room with:', selectedUser.username);
      socket.emit('leave-private-room', { toUsername: selectedUser.username });
    };
  }, [socket, selectedUser, socketStatus, unreadCounts, currentUser.username]);

  // User selection
  const selectUser = (user) => {
    console.log('👤 [Chat] Selected user:', user.username);
    setSelectedUser(user);
    setSearchTerm('');
  };

  // Send message
  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !socket || socketStatus !== 'connected') {
      return;
    }

    console.log('💬 [Chat] Sending message to:', selectedUser.username);
    
    socket.emit('send-private-message', {
      toUsername: selectedUser.username,
      content: newMessage.trim()
    });

    setNewMessage('');
  };

  // Notification sound
  const playNotificationSound = () => {
    try {
      if (audioRef.current) {
        audioRef.current.play().catch(err => {
          console.log('Audio play failed:', err);
        });
      }
    } catch (error) {
      console.log('Audio play error:', error);
    }
  };

  // Utility functions
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role) => {
    const colors = {
      'ban-giam-doc': '#e53e3e',
      'quan-tri-tin-dung': '#3182ce',
      'quan-ly-khach-hang': '#38a169',
      'quan-ly-giao-dich': '#d69e2e',
      'admin': '#805ad5',
      'default': '#95a5a6'
    };
    return colors[role] || colors.default;
  };

  const getLastMessage = (username) => {
    const conversation = messages[username] || [];
    return conversation[conversation.length - 1];
  };

  // Filter users based on search
  const filteredUsers = users.filter(user => {
    if (!user || !user.username) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      (user.role && user.role.toLowerCase().includes(searchLower))
    );
  });

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '450px',
      height: '650px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      border: '1px solid #e0eafc',
      overflow: 'hidden'
    }}>
      {/* Audio for notifications */}
      <audio ref={audioRef} preload="auto">
        <source src="/notification.mp3" type="audio/mpeg" />
      </audio>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '16px 16px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            💬 Chat nội bộ
          </h3>
          <small style={{ opacity: 0.9 }}>
            {onlineUsers.length} người online • {filteredUsers.length} tổng số
            {socketStatus !== 'connected' && (
              <span style={{ color: '#ff6b6b', marginLeft: '10px' }}>
                • {socketStatus === 'disconnected' ? 'Mất kết nối' : 'Đang kết nối...'}
              </span>
            )}
          </small>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
          onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
        >
          ×
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div style={{
          padding: '10px 15px',
          background: '#ffebee',
          color: '#c62828',
          fontSize: '12px',
          borderBottom: '1px solid #ffcdd2'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Search bar */}
      <div style={{
        padding: '15px',
        background: '#f8f9fa',
        borderBottom: '1px solid #e0eafc'
      }}>
        <input
          type="text"
          placeholder="🔍 Tìm kiếm user..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 15px',
            border: '1px solid #ddd',
            borderRadius: '25px',
            outline: 'none',
            fontSize: '14px',
            background: 'white'
          }}
        />
      </div>

      {/* User list */}
      <div style={{
        padding: '10px 15px',
        background: '#f8f9fa',
        borderBottom: '1px solid #e0eafc',
        maxHeight: '200px',
        overflowY: 'auto'
      }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px', fontWeight: '600' }}>
          Danh sách người dùng ({filteredUsers.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading && (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              color: '#666', 
              fontSize: '14px',
              background: 'white',
              borderRadius: '8px'
            }}>
              Đang tải danh sách...
            </div>
          )}
          {!loading && filteredUsers.length === 0 && (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              color: '#666', 
              fontSize: '14px',
              background: 'white',
              borderRadius: '8px'
            }}>
              Không tìm thấy user nào
            </div>
          )}
          {filteredUsers.map((user) => {
            const lastMessage = getLastMessage(user.username);
            const isOnline = onlineUsers.includes(user.username);
            const isSelected = selectedUser?.username === user.username;
            const unreadCount = unreadCounts[user.username] || 0;
            
            return (
              <button
                key={user.username}
                onClick={() => selectUser(user)}
                style={{
                  padding: '12px 15px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isSelected ? '#e3f2fd' : 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  textAlign: 'left',
                  position: 'relative',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                  borderLeft: isSelected ? '4px solid #007bff' : '4px solid transparent'
                }}
                onMouseOver={(e) => {
                  if (!isSelected) e.target.style.background = '#f8f9fa';
                }}
                onMouseOut={(e) => {
                  if (!isSelected) e.target.style.background = 'white';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: getRoleColor(user.role),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: isOnline ? '#4caf50' : '#bbb',
                      border: '2px solid white'
                    }}></div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      color: isOnline ? '#2ecc71' : '#333',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {user.username}
                      {unreadCount > 0 && (
                        <span style={{
                          background: '#ff4757',
                          color: 'white',
                          borderRadius: '50%',
                          minWidth: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          padding: '0 4px'
                        }}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      color: isOnline ? '#4caf50' : '#888',
                      marginBottom: '4px'
                    }}>
                      {isOnline ? '🟢 Online' : '⚫ Offline'} • {user.role || 'Chưa có role'}
                    </div>
                    {lastMessage && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: unreadCount > 0 ? '#333' : '#666',
                        fontWeight: unreadCount > 0 ? 'bold' : 'normal',
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        maxWidth: '200px'
                      }}>
                        {lastMessage.content}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '15px',
        background: '#f8f9fa',
        position: 'relative'
      }}>
        {!selectedUser ? (
          <div style={{
            textAlign: 'center',
            color: '#666',
            marginTop: '100px',
            fontSize: '16px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>💬</div>
            Chọn một người để bắt đầu chat
          </div>
        ) : (
          <div>
            {/* Chat header */}
            <div style={{
              background: 'white',
              padding: '15px',
              borderRadius: '12px',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: getRoleColor(selectedUser.role),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold'
              }}>
                {selectedUser.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#333' }}>
                  {selectedUser.username}
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  {onlineUsers.includes(selectedUser.username) ? '🟢 Online' : '⚫ Offline'}
                </div>
              </div>
            </div>

            {/* Messages */}
            {(messages[selectedUser.username] || []).map((message, index) => (
              <div key={message._id || message.id || index} style={{
                marginBottom: '10px',
                display: 'flex',
                flexDirection: message.from === currentUser.username ? 'row-reverse' : 'row'
              }}>
                <div style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: message.from === currentUser.username ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
                  background: message.from === currentUser.username ? '#007bff' : 'white',
                  color: message.from === currentUser.username ? 'white' : '#333',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  wordWrap: 'break-word'
                }}>
                  <div style={{ lineHeight: '1.4' }}>{message.content}</div>
                  <div style={{
                    fontSize: '11px',
                    marginTop: '6px',
                    opacity: 0.7,
                    textAlign: 'right'
                  }}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{
        padding: '15px',
        borderTop: '1px solid #e0eafc',
        background: 'white',
        borderRadius: '0 0 16px 16px'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={selectedUser ? `Nhập tin nhắn cho ${selectedUser.username}...` : "Chọn người chat trước..."}
            disabled={!selectedUser || socketStatus !== 'connected'}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid #ddd',
              borderRadius: '25px',
              outline: 'none',
              fontSize: '14px',
              opacity: (selectedUser && socketStatus === 'connected') ? 1 : 0.5,
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !selectedUser || socketStatus !== 'connected'}
            style={{
              padding: '12px 20px',
              background: (newMessage.trim() && selectedUser && socketStatus === 'connected') ? '#007bff' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: (newMessage.trim() && selectedUser && socketStatus === 'connected') ? 'pointer' : 'not-allowed',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => {
              if (newMessage.trim() && selectedUser && socketStatus === 'connected') {
                e.target.style.background = '#0056b3';
              }
            }}
            onMouseOut={(e) => {
              if (newMessage.trim() && selectedUser && socketStatus === 'connected') {
                e.target.style.background = '#007bff';
              }
            }}
          >
            Gửi
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat; 