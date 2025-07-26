require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Đã kết nối MongoDB thành công!'))
.catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var hosoRouter = require('./routes/hoso');
var authRouter = require('./routes/auth');
var adminRouter = require('./routes/admin');
var financialRouter = require('./routes/financial');
var aiRouter = require('./routes/ai');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://fe-banking.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user-role']
}));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/hoso', hosoRouter);
app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/financial', financialRouter);
app.use('/ai', aiRouter);

// Tạo HTTP server
const server = createServer(app);

// Tạo Socket.IO server
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://manage-customer-in-bank-fe.vercel.app'
    ],
    methods: ['GET', 'POST']
  }
});

// --- Quản lý user online và tin nhắn ---
const onlineUsers = new Map(); // username -> { socketId, role }
const conversations = new Map(); // roomName -> [messages] (tối đa 100 tin nhắn)

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Khi user đăng nhập/join chat, lưu thông tin user
  socket.on('join-chat', (user) => {
    console.log('👤 User joining chat:', user);
    socket.user = user;
    onlineUsers.set(user.username, { socketId: socket.id, role: user.role });
    // Gửi danh sách user online cho tất cả client
    const onlineUsersList = Array.from(onlineUsers.entries()).map(([username, info]) => ({ username, role: info.role }));
    console.log('📱 Broadcasting online users:', onlineUsersList);
    io.emit('users-online', onlineUsersList);
    console.log(`💬 User joined chat: ${user.username}`);
  });

  // Khi user chọn chat với user khác, join phòng chat riêng
  socket.on('join-private-room', ({ toUsername }) => {
    if (!socket.user || !toUsername) return;
    const usernames = [socket.user.username, toUsername].sort();
    const roomName = `private_${usernames[0]}_${usernames[1]}`;
    socket.join(roomName);
    socket.currentPrivateRoom = roomName;
    console.log(`💬 User ${socket.user.username} joined private room: ${roomName} with ${toUsername}`);
    
    // Gửi lịch sử tin nhắn nếu có
    if (conversations.has(roomName)) {
      const messages = conversations.get(roomName);
      socket.emit('chat-history', { room: roomName, messages });
    }
    
    // Gửi xác nhận join phòng
    socket.emit('joined-private-room', { room: roomName, with: toUsername });
  });

  // Khi gửi tin nhắn riêng
  socket.on('send-private-message', ({ toUsername, content }) => {
    if (!socket.user || !toUsername || !content) return;
    const usernames = [socket.user.username, toUsername].sort();
    const roomName = `private_${usernames[0]}_${usernames[1]}`;
    const message = {
      id: Date.now(),
      content,
      sender: socket.user.username,
      role: socket.user.role,
      to: toUsername,
      timestamp: new Date().toISOString()
    };
    
    // Lưu tin nhắn vào conversation
    if (!conversations.has(roomName)) {
      conversations.set(roomName, []);
    }
    const roomMessages = conversations.get(roomName);
    roomMessages.push(message);
    
    // Giới hạn 100 tin nhắn, xóa tin nhắn cũ sau 50 tin
    if (roomMessages.length > 100) {
      conversations.set(roomName, roomMessages.slice(-50));
    }
    
    console.log(`💬 [${roomName}] Sending message: ${socket.user.username} -> ${toUsername}: ${content}`);
    console.log(`💬 Broadcasting to room: ${roomName}`);
    io.to(roomName).emit('private-message', message);
  });

  // Khi user rời phòng chat riêng
  socket.on('leave-private-room', ({ toUsername }) => {
    if (!socket.user || !toUsername) return;
    const usernames = [socket.user.username, toUsername].sort();
    const roomName = `private_${usernames[0]}_${usernames[1]}`;
    socket.leave(roomName);
    socket.currentPrivateRoom = null;
    console.log(`💬 User ${socket.user.username} left private room: ${roomName}`);
  });

  // Khi user disconnect/logout
  socket.on('disconnect', () => {
    if (socket.user) {
      console.log('🔌 User disconnecting:', socket.user.username);
      onlineUsers.delete(socket.user.username);
      const onlineUsersList = Array.from(onlineUsers.entries()).map(([username, info]) => ({ username, role: info.role }));
      console.log('📱 Broadcasting updated online users after disconnect:', onlineUsersList);
      io.emit('users-online', onlineUsersList);
      console.log('🔌 Client disconnected:', socket.user.username);
    } else {
      console.log('🔌 Client disconnected:', socket.id);
    }
  });
});

// Set io instance cho notifications
const { setIO } = require('./utils/notifications');
setIO(io);

// Export cả app và io để sử dụng ở nơi khác
module.exports = { app, server, io };
