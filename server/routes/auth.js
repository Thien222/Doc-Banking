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

// Đăng ký (disable email OTP cho VPS)
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password || !email) return res.status(400).json({ error: 'Thiếu thông tin' });
    const exist = await User.findOne({ $or: [{ username }, { email }] });
    if (exist) return res.status(400).json({ error: 'Username hoặc email đã tồn tại' });
    const hash = await bcrypt.hash(password, 10);
    
    // Tạm disable email OTP để tránh lỗi credentials
    // const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
    // await sendOTP(email, otp);
    
    // Tạo user với emailVerified = true để login ngay được
    await User.create({ 
      username, 
      password: hash, 
      email, 
      emailVerified: true, // Auto verify để login được
      isActive: true, // Auto active để login được
      role: 'khach-hang' // Default role
    });
    res.status(201).json({ message: 'Đăng ký thành công! Vui lòng đăng nhập.' });
  } catch (err) {
    console.error('❌ [REGISTER] Error:', err);
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

module.exports = router; 
 
// Firebase email-link: verify ID token rồi tạo user nội bộ, phát hành JWT
router.post('/firebase-register', async (req, res) => {
  try {
    const { email, username, firebaseIdToken } = req.body;
    if (!firebaseIdToken || !email) {
      return res.status(400).json({ error: 'Thiếu token hoặc email' });
    }
    const decoded = await admin.auth().verifyIdToken(firebaseIdToken);
    if (!decoded || decoded.email !== email) {
      return res.status(401).json({ error: 'Firebase token không hợp lệ' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      const safeUsername = username || (email.split('@')[0]);
      user = await User.create({
        username: safeUsername,
        password: await bcrypt.hash(Math.random().toString(36).slice(-12), 10),
        email,
        emailVerified: true,
        isActive: true, // Auto active cho Firebase users
        role: 'khach-hang',
        ssoProvider: 'firebase', // Mark as Firebase user
      });
      console.log('✅ [FIREBASE] Created new user:', safeUsername, 'with email:', email);
    } else if (!user.emailVerified) {
      user.emailVerified = true;
      await user.save();
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    return res.json({ token, user: { username: user.username, role: user.role } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});