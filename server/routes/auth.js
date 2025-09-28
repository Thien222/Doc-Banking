const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const admin = require('../config/firebase');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';
const EMAIL_USER = process.env.EMAIL_USER || 'your_email@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'your_app_password';

const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});

// Verify transporter at startup for easier debugging
transporter.verify()
.then(() => console.log('📧 [MAIL] Transport ready'))
.catch(err => console.error('❌ [MAIL] Transport error:', err?.message || err));

// Hàm gửi mail OTP
async function sendOTP(email, otp) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Mã xác thực đăng ký tài khoản',
    text: `Mã OTP của bạn là: ${otp}`,
  });
}

// Tạo sẵn admin nếu chưa có
User.findOne({ username: 'admin' }).then(async (admin) => {
  if (!admin) {
    const hash = await bcrypt.hash('admin123', 10);
    await User.create({ username: 'admin', password: hash, role: 'admin', isActive: true, email: 'admin@local', emailVerified: true });
    console.log('✅ Đã tạo user admin mặc định (username: admin, password: admin123)');
  }
});

// Đăng ký traditional (không dùng Firebase)
router.post('/register', async (req, res) => {
  try {
    console.log('📝 [TRADITIONAL REGISTER] Request:', req.body);
    const { username, password, email } = req.body;
    if (!username || !password || !email) return res.status(400).json({ error: 'Thiếu thông tin' });
    
    const exist = await User.findOne({ $or: [{ username }, { email }] });
    if (exist) return res.status(400).json({ error: 'Username hoặc email đã tồn tại' });
    
    const hash = await bcrypt.hash(password, 10);
    
    // SỬA: Tạo user với trạng thái chờ admin duyệt
    const newUser = await User.create({ 
      username, 
      password: hash, 
      email, 
      emailVerified: true, // Auto verify cho traditional register
      isActive: false, // SỬA: Để false để admin duyệt
      role: null, // SỬA: Để null để admin cấp role
      isSsoUser: false, // Không phải SSO user
      ssoProvider: null
    });
    
    console.log('✅ [TRADITIONAL REGISTER] Created user:', newUser.username, 'ID:', newUser._id);
    
    res.status(201).json({ 
      message: 'Đăng ký thành công! Tài khoản đã được tạo và chờ admin duyệt quyền truy cập.',
      user: {
        username: newUser.username,
        email: newUser.email,
        isActive: newUser.isActive,
        role: newUser.role,
        needsApproval: true
      }
    });
  } catch (err) {
    console.error('❌ [TRADITIONAL REGISTER] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Xác thực OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Không tìm thấy user' });
    if (user.emailVerified) return res.status(400).json({ error: 'Email đã xác thực' });
    if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ error: 'OTP không đúng hoặc đã hết hạn' });
    }
    user.emailVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    res.json({ message: 'Xác thực email thành công! Chờ admin duyệt tài khoản.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Đăng nhập
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ $or: [ { username }, { email: username } ] });
    if (!user) return res.status(400).json({ error: 'Sai tài khoản hoặc mật khẩu (not_found)' });
    // Tạm disable email verification để login được trên VPS  
    // if (!user.emailVerified) return res.status(403).json({ error: 'Email chưa xác thực' });
    if (!user.isActive) return res.status(403).json({ error: 'Tài khoản chưa được admin duyệt/cấp role' });
    let isPasswordValid = false;
    
    // Try bcrypt first
    if (user.password && user.password.startsWith('$2b$')) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      // Fallback: check plaintext password và hash lại
      if (user.password === password) {
        console.log('🔐 [AUTH] Converting plaintext password to hash for user:', username);
        user.password = await bcrypt.hash(password, 10);
        await user.save();
        isPasswordValid = true;
      }
    }
    
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Sai tài khoản hoặc mật khẩu (mismatch)' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test route to check if Firebase register works
router.get('/test-firebase', async (req, res) => {
  try {
    const users = await User.find({ ssoProvider: 'firebase' }).select('username email role isActive');
    res.json({ 
      message: 'Firebase users found', 
      count: users.length,
      users: users
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Firebase email-link: verify ID token rồi tạo user nội bộ, phát hành JWT
router.post('/firebase-register', async (req, res) => {
  try {
    console.log('🔥 [FIREBASE] Received firebase-register request:', req.body);
    const { email, username, firebaseIdToken } = req.body;
    if (!firebaseIdToken || !email) {
      console.log('❌ [FIREBASE] Missing required fields');
      return res.status(400).json({ error: 'Thiếu token hoặc email' });
    }
    
    console.log('🔍 [FIREBASE] Verifying token...');
    const decoded = await admin.auth().verifyIdToken(firebaseIdToken);
    if (!decoded || decoded.email !== email) {
      console.log('❌ [FIREBASE] Token verification failed');
      return res.status(401).json({ error: 'Firebase token không hợp lệ' });
    }

    console.log('👤 [FIREBASE] Looking for existing user...');
    let user = await User.findOne({ email });
    if (!user) {
      const safeUsername = username || (email.split('@')[0]);
      console.log('➕ [FIREBASE] Creating new user:', safeUsername);
      
      user = await User.create({
        username: safeUsername,
        password: await bcrypt.hash(Math.random().toString(36).slice(-12), 10),
        email,
        emailVerified: true,
        isActive: false, // SỬA: Để false để admin có thể thấy và duyệt
        role: null, // SỬA: Để null để admin cấp role
        ssoProvider: 'firebase', // Mark as Firebase user
        isSsoUser: true // SỬA: Thêm flag này để dễ nhận biết
      });
      console.log('✅ [FIREBASE] Created new user:', safeUsername, 'with email:', email, 'ID:', user._id);
      
      // Trả về message để user biết cần chờ admin duyệt
      return res.json({ 
        message: 'Đăng ký thành công! Vui lòng chờ admin duyệt tài khoản và cấp quyền.',
        needsApproval: true,
        user: { 
          username: user.username, 
          email: user.email,
          isActive: user.isActive,
          role: user.role
        } 
      });
    } else {
      console.log('👤 [FIREBASE] User already exists:', user.username);
      if (!user.emailVerified) {
        user.emailVerified = true;
        await user.save();
        console.log('✅ [FIREBASE] Updated email verification for existing user');
      }
      
      // Nếu user đã tồn tại nhưng chưa active, trả về message chờ duyệt
      if (!user.isActive || !user.role) {
        return res.json({
          message: 'Tài khoản đã tồn tại nhưng chưa được duyệt. Vui lòng chờ admin cấp quyền.',
          needsApproval: true,
          user: { 
            username: user.username, 
            email: user.email,
            isActive: user.isActive,
            role: user.role
          } 
        });
      }
    }

    // Nếu user đã active và có role, tạo token bình thường
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    console.log('✅ [FIREBASE] Token generated for user:', user.username);
    return res.json({ 
      token, 
      user: { 
        username: user.username, 
        role: user.role,
        email: user.email,
        id: user._id
      } 
    });
  } catch (err) {
    console.error('❌ [FIREBASE] Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Route để admin lấy danh sách users cần duyệt
router.get('/pending-users', async (req, res) => {
  try {
    // Chỉ admin mới có thể xem
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Không có token' });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const adminUser = await User.findById(decoded.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền xem' });
    }
    
    // Lấy users chưa được duyệt hoặc chưa có role
    const pendingUsers = await User.find({
      $or: [
        { isActive: false },
        { role: null }
      ]
    }).select('username email role isActive createdAt ssoProvider isSsoUser').sort({ createdAt: -1 });
    
    console.log(`📋 [ADMIN] Found ${pendingUsers.length} pending users`);
    res.json({ users: pendingUsers });
  } catch (err) {
    console.error('❌ [ADMIN] Error fetching pending users:', err);
    res.status(500).json({ error: err.message });
  }
});

// Route để admin duyệt user và cấp role
router.put('/approve-user/:userId', async (req, res) => {
  try {
    const { role } = req.body;
    const { userId } = req.params;
    
    // Chỉ admin mới có thể duyệt
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Không có token' });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const adminUser = await User.findById(decoded.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền duyệt' });
    }
    
    const validRoles = ['khach-hang', 'quan-ly-khach-hang', 'quan-tri-tin-dung', 'ban-giam-doc', 'quan-ly-giao-dich'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Role không hợp lệ' });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        role: role,
        isActive: true // Active luôn khi duyệt
      },
      { new: true }
    ).select('username email role isActive');
    
    if (!user) return res.status(404).json({ error: 'Không tìm thấy user' });
    
    console.log(`✅ [ADMIN] Approved user ${user.username} with role ${role}`);
    res.json({ 
      message: `Đã duyệt user ${user.username} với role ${role}`,
      user 
    });
  } catch (err) {
    console.error('❌ [ADMIN] Error approving user:', err);
    res.status(500).json({ error: err.message });
  }
});

// Route để admin từ chối user
router.delete('/reject-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Chỉ admin mới có thể từ chối
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Không có token' });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const adminUser = await User.findById(decoded.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền từ chối' });
    }
    
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy user' });
    
    console.log(`🗑️ [ADMIN] Rejected and deleted user ${user.username}`);
    res.json({ message: `Đã từ chối và xóa user ${user.username}` });
  } catch (err) {
    console.error('❌ [ADMIN] Error rejecting user:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;