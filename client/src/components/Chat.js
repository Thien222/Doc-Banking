import React, { useState, useEffect, useRef } from 'react';
import pushNotificationManager from '../utils/pushNotifications';

const Chat = ({ isOpen, onClose, socket }) => {
  const [conversations, setConversations] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [allUsers, setAllUsers] = useState([]); // Danh sách tất cả user
  const [onlineUsers, setOnlineUsers] = useState([]); // Danh sách user online
  const [selectedUser, setSelectedUser] = useState(null);
  const [readConversations, setReadConversations] = useState({});
  const currentUser = {
    username: localStorage.getItem('username') || 'Unknown',
    role: localStorage.getItem('role') || 'Unknown'
  };
  const messagesEndRef = useRef(null);

  // Emit join-chat mỗi khi mở chat (isOpen=true)
  useEffect(() => {
    if (isOpen && socket) {
      socket.emit('join-chat', {
        username: currentUser.username,
        role: currentUser.role
      });
    }
  }, [isOpen, socket, currentUser.username, currentUser.role]);

  // Tự động emit join-chat khi socket reconnect
  useEffect(() => {
    if (!socket) return;
    const handleConnect = () => {
      socket.emit('join-chat', {
        username: currentUser.username,
        role: currentUser.role
      });
    };
    socket.on('connect', handleConnect);
    return () => socket.off('connect', handleConnect);
  }, [socket, currentUser.username, currentUser.role]);

  // Fetch danh sách user khi mở chat
  useEffect(() => {
    if (!isOpen) return;
    fetch('/users/list')
      .then(res => res.json())
      .then(users => {
        // Hiển thị cả chính mình trong danh sách
        setAllUsers(users);
      });
  }, [isOpen, currentUser]);

  // Lắng nghe trạng thái online từ socket
  useEffect(() => {
    if (!isOpen || !socket) return;
    const handleOnline = (onlineUsers) => {
      console.log('📱 Received online users:', onlineUsers);
      setOnlineUsers(onlineUsers.map(u => u.username));
    };
    socket.on('users-online', handleOnline);
    return () => socket.off('users-online', handleOnline);
  }, [isOpen, socket]);

  // Lắng nghe tin nhắn
  useEffect(() => {
    if (!isOpen || !socket) return;
    const handlePrivateMsg = (message) => {
      console.log('💬 Received private message:', message);
      const sender = message.sender === currentUser.username ? message.to : message.sender;
      setConversations(prev => {
        const updated = { ...prev };
        if (!updated[sender]) updated[sender] = [];
        updated[sender] = [...updated[sender], message];
        if (updated[sender].length > 100) updated[sender] = updated[sender].slice(-50);
        return updated;
      });
      if (!pushNotificationManager.isTabFocused()) {
        pushNotificationManager.sendChatNotification(message);
      }
    };
    socket.on('private-message', handlePrivateMsg);
    return () => socket.off('private-message', handlePrivateMsg);
  }, [isOpen, socket, currentUser]);

  // Lắng nghe lịch sử chat khi join phòng
  useEffect(() => {
    if (!isOpen || !socket) return;
    const handleHistory = ({ room, messages }) => {
      if (!selectedUser) return;
      setConversations(prev => ({ ...prev, [selectedUser.username]: messages }));
    };
    socket.on('chat-history', handleHistory);
    return () => socket.off('chat-history', handleHistory);
  }, [isOpen, socket, selectedUser]);

  // Khi mở chat, join phòng và lấy lịch sử với tất cả user
  useEffect(() => {
    if (!isOpen || !socket || allUsers.length === 0) return;
    allUsers.forEach(user => {
      if (user.username !== currentUser.username) {
        socket.emit('join-private-room', { toUsername: user.username });
      }
    });
  }, [isOpen, socket, allUsers, currentUser.username]);

  const selectUser = (user) => {
    setSelectedUser(user);
    setReadConversations(prev => ({ ...prev, [user.username]: true }));
    if (socket) {
      socket.emit('join-private-room', { toUsername: user.username });
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;
    
    // Chỉ gửi qua socket, không tự thêm vào UI
    if (socket) {
      socket.emit('send-private-message', {
        toUsername: selectedUser.username,
        content: newMessage
      });
    }
    setNewMessage('');
  };

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
      'admin': '#805ad5'
    };
    return colors[role] || '#666';
  };

  const getLastMessage = (username) => {
    const messages = conversations[username] || [];
    return messages[messages.length - 1];
  };

  const getUnreadCount = (username) => {
    const messages = conversations[username] || [];
    // Nếu đã xem hội thoại thì không có tin chưa đọc
    if (readConversations[username]) return 0;
    // Đếm tin nhắn gửi đến mình mà mình chưa xem
    return messages.filter(msg => msg.sender !== currentUser.username).length;
  };

  const getLastUnreadMessage = (username) => {
    const messages = conversations[username] || [];
    // Lọc tin nhắn gửi đến mình
    const unread = messages.filter(msg => msg.sender !== currentUser.username);
    return unread.length > 0 ? unread[unread.length - 1].content : '';
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      height: '600px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      border: '1px solid #e0eafc'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '15px',
        borderRadius: '12px 12px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px' }}>
            💬 Chat nội bộ
          </h3>
          {/* Số người online: tổng số user online (bao gồm cả mình) */}
          <small>{onlineUsers.length} người online</small>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '5px'
          }}
        >
          ×
        </button>
      </div>

      {/* Sidebar user list */}
      <div style={{
        padding: '10px 15px',
        background: '#f8f9fa',
        borderBottom: '1px solid #e0eafc',
        maxHeight: '200px',
        overflowY: 'auto'
      }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
          <strong>Danh sách user:</strong>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {allUsers.map((user) => {
            const lastMessage = getLastMessage(user.username);
            const unreadCount = getUnreadCount(user.username);
            const isSelected = selectedUser?.username === user.username;
            const isOnline = onlineUsers.includes(user.username);
            const isRead = readConversations[user.username];
            return (
              <button
                key={user.username}
                onClick={() => selectUser(user)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isSelected ? '#e3f2fd' : 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textAlign: 'left',
                  position: 'relative',
                  opacity: isRead ? 0.6 : 1, // Mờ nếu đã xem
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isOnline ? '#4caf50' : '#bbb',
                    display: 'inline-block'
                  }}></span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>{user.username}</div>
                    <div style={{ fontSize: '10px', color: '#888' }}>{user.role}</div>
                    {/* Hiển thị tin nhắn chưa đọc hoặc số lượng */}
                    {unreadCount === 1 && !isRead && (
                      <div style={{ fontSize: '11px', color: '#007bff', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                        {getLastUnreadMessage(user.username)}
                      </div>
                    )}
                    {unreadCount > 1 && !isRead && (
                      <div style={{ fontSize: '11px', color: '#ff4757', fontWeight: 700 }}>
                        {unreadCount}+
                      </div>
                    )}
                    {/* Nếu không có tin chưa đọc, hiển thị tin nhắn cuối cùng (mờ) */}
                    {unreadCount === 0 && lastMessage && (
                      <div style={{ fontSize: '11px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                        {lastMessage.content}
                      </div>
                    )}
                  </div>
                  {/* Badge số lượng tin chưa đọc */}
                  {unreadCount > 1 && !isRead && (
                    <span style={{
                      background: '#ff4757',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      marginLeft: 8
                    }}>
                      {unreadCount}+
                    </span>
                  )}
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
        background: '#f8f9fa'
      }}>
        {!selectedUser ? (
          <div style={{
            textAlign: 'center',
            color: '#666',
            marginTop: '50px',
            fontSize: '14px'
          }}>
            Chọn một người để bắt đầu chat
          </div>
        ) : (
          (conversations[selectedUser.username] || []).map((message) => (
            <div key={message.id} style={{
              marginBottom: '10px',
              display: 'flex',
              flexDirection: message.sender === currentUser.username ? 'row-reverse' : 'row'
            }}>
              <div style={{
                maxWidth: '70%',
                padding: '8px 12px',
                borderRadius: message.sender === currentUser.username ? '15px 15px 5px 15px' : '15px 15px 15px 5px',
                background: message.sender === currentUser.username ? '#007bff' : 'white',
                color: message.sender === currentUser.username ? 'white' : '#333',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                wordWrap: 'break-word'
              }}>
                <div style={{
                  fontSize: '12px',
                  marginBottom: '4px',
                  opacity: 0.8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <span style={{ fontWeight: 'bold' }}>{message.sender}</span>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    background: getRoleColor(message.role),
                    color: 'white'
                  }}>
                    {message.role}
                  </span>
                </div>
                <div>{message.content}</div>
                <div style={{
                  fontSize: '10px',
                  marginTop: '4px',
                  opacity: 0.7,
                  textAlign: 'right'
                }}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{
        padding: '15px',
        borderTop: '1px solid #e0eafc',
        background: 'white',
        borderRadius: '0 0 12px 12px'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={selectedUser ? `Nhập tin nhắn cho ${selectedUser.username}...` : "Chọn người chat trước..."}
            disabled={!selectedUser}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '20px',
              outline: 'none',
              opacity: selectedUser ? 1 : 0.5
            }}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !selectedUser}
            style={{
              padding: '8px 16px',
              background: (newMessage.trim() && selectedUser) ? '#007bff' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: (newMessage.trim() && selectedUser) ? 'pointer' : 'not-allowed'
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