require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const passport = require('./config/passport');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const hosoRouter = require('./routes/hoso');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const financialRouter = require('./routes/financial');
const aiRouter = require('./routes/ai');
const messagesRouter = require('./routes/mesages');
const ssoRouter = require('./routes/sso');
const Message = require('./models/Message');
const { setIO } = require('./utils/notifications');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Đã kết nối MongoDB thành công!'))
.catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration for SSO
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://fe-banking.vercel.app',
    'https://fe-bank-frontend.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user-role', 'X-Requested-With']
}));

// Pre-flight requests
app.options('*', cors());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/hoso', hosoRouter);
app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/financial', financialRouter);
app.use('/ai', aiRouter);
app.use('/messages', messagesRouter);
app.use('/sso', ssoRouter);

// Tạo HTTP server
const server = createServer(app);

// Tạo Socket.IO server với CORS configuration
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://fe-banking.vercel.app',
      'https://fe-bank-frontend.vercel.app'
    ],
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Set io instance cho notifications
setIO(io);
console.log('🔔 [SERVER] IO instance set for notifications');

const onlineUsers = new Map(); // username -> socketId
const typingUsers = new Map(); // username -> { typingWith: targetUser, timeout: timer }

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Khi user đăng nhập/join chat
  socket.on('join-chat', (user) => {
    console.log(`👤 User joined chat: ${user.username} (${user.role})`);
    socket.user = user;
    onlineUsers.set(user.username, socket.id);
    socket.join(user.role);
    
    // Emit danh sách online users cho tất cả clients
    const onlineUsernames = Array.from(onlineUsers.keys());
    console.log(`📡 Emitting online users:`, onlineUsernames);
    io.emit('users-online', onlineUsernames);
    
    // Confirm join to the user
    socket.emit('joined-chat', { 
      username: user.username, 
      role: user.role,
      onlineUsers: onlineUsernames 
    });
  });

  // Khi client request online users
  socket.on('request-online-users', () => {
    if (!socket.user) return;
    console.log(`📡 ${socket.user.username} requesting online users`);
    const onlineUsernames = Array.from(onlineUsers.keys());
    socket.emit('users-online', onlineUsernames);
  });

  // Khi user chọn chat với user khác, join phòng chat riêng
  socket.on('join-private-room', async ({ toUsername }) => {
    if (!socket.user || !toUsername) {
      console.log('❌ Invalid join-private-room data:', { user: socket.user, toUsername });
      return;
    }
    
    console.log(`💬 ${socket.user.username} joining private room with ${toUsername}`);
    
    const usernames = [socket.user.username, toUsername].sort();
    const roomName = `private_${usernames[0]}_${usernames[1]}`;
    socket.join(roomName);
    socket.currentPrivateRoom = roomName;
    
    // Lấy lịch sử chat từ DB
    try {
      const messages = await Message.find({
        $or: [
          { from: usernames[0], to: usernames[1] },
          { from: usernames[1], to: usernames[0] }
        ]
      }).sort({ timestamp: 1 });
      
      socket.emit('chat-history', { room: roomName, messages });
      socket.emit('joined-private-room', { room: roomName, with: toUsername });
      console.log(`📜 Loaded ${messages.length} messages for room ${roomName}`);
    } catch (error) {
      console.error('❌ Error loading chat history:', error);
      socket.emit('chat-error', { message: 'Không thể tải lịch sử chat' });
    }
  });

  // Khi gửi tin nhắn riêng
  socket.on('send-private-message', async ({ toUsername, content }) => {
    if (!socket.user || !toUsername || !content) {
      console.log('❌ Invalid message data:', { user: socket.user, toUsername, content });
      return;
    }
    
    console.log(`💬 ${socket.user.username} sending message to ${toUsername}: ${content.substring(0, 50)}...`);
    
    const from = socket.user.username;
    const to = toUsername;
    const role = socket.user.role;
    
    try {
      const message = await Message.create({
        from, to, content, read: false, timestamp: new Date()
      });
      
      const usernames = [from, to].sort();
      const roomName = `private_${usernames[0]}_${usernames[1]}`;
      
      const messageData = {
        ...message.toObject(),
        sender: from,
        role,
      };
      
      // Emit to all users in the room (including sender for confirmation)
      io.to(roomName).emit('private-message', messageData);
      console.log(`✅ Message sent to room ${roomName}`);
      
      // Đánh dấu đã đọc nếu người nhận online
      const recipientSocketId = onlineUsers.get(to);
      if (recipientSocketId) {
        console.log(`📱 Recipient ${to} is online, message delivered`);
      } else {
        console.log(`📱 Recipient ${to} is offline, message saved to DB`);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      socket.emit('chat-error', { message: 'Không thể gửi tin nhắn' });
    }
  });

  // Typing indicator
  socket.on('typing-start', ({ toUsername }) => {
    if (!socket.user || !toUsername) return;
    
    console.log(`⌨️ ${socket.user.username} is typing to ${toUsername}`);
    
    const usernames = [socket.user.username, toUsername].sort();
    const roomName = `private_${usernames[0]}_${usernames[1]}`;
    
    // Clear existing timeout
    const existingTimeout = typingUsers.get(socket.user.username);
    if (existingTimeout && existingTimeout.timeout) {
      clearTimeout(existingTimeout.timeout);
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      socket.emit('typing-stop', { username: socket.user.username });
      typingUsers.delete(socket.user.username);
    }, 3000);
    
    typingUsers.set(socket.user.username, { typingWith: toUsername, timeout });
    
    // Emit to room (excluding sender)
    socket.to(roomName).emit('typing-start', { username: socket.user.username });
  });

  socket.on('typing-stop', ({ toUsername }) => {
    if (!socket.user || !toUsername) return;
    
    console.log(`⏹️ ${socket.user.username} stopped typing to ${toUsername}`);
    
    const usernames = [socket.user.username, toUsername].sort();
    const roomName = `private_${usernames[0]}_${usernames[1]}`;
    
    // Clear timeout
    const existingTimeout = typingUsers.get(socket.user.username);
    if (existingTimeout && existingTimeout.timeout) {
      clearTimeout(existingTimeout.timeout);
    }
    typingUsers.delete(socket.user.username);
    
    // Emit to room (excluding sender)
    socket.to(roomName).emit('typing-stop', { username: socket.user.username });
  });

  socket.on('leave-private-room', ({ toUsername }) => {
    if (!socket.user || !toUsername) return;
    
    console.log(`🚪 ${socket.user.username} leaving private room with ${toUsername}`);
    
    const usernames = [socket.user.username, toUsername].sort();
    const roomName = `private_${usernames[0]}_${usernames[1]}`;
    socket.leave(roomName);
    socket.currentPrivateRoom = null;
  });

  socket.on('disconnect', () => {
    if (socket.user) {
      console.log(`🔌 User disconnected: ${socket.user.username}`);
      onlineUsers.delete(socket.user.username);
      
      // Clear typing indicator
      const existingTimeout = typingUsers.get(socket.user.username);
      if (existingTimeout && existingTimeout.timeout) {
        clearTimeout(existingTimeout.timeout);
      }
      typingUsers.delete(socket.user.username);
      
      // Emit updated online users list
      const onlineUsernames = Array.from(onlineUsers.keys());
      io.emit('users-online', onlineUsernames);
    }
  });
});

module.exports = { app, server, io };