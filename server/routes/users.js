const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware để verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Lấy tất cả user (đầy đủ thông tin) - yêu cầu authentication
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({
      username: { $exists: true, $ne: null }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy danh sách user chỉ gồm username và role (dùng cho chat) - không yêu cầu authentication
router.get('/list', async (req, res) => {
  try {
    console.log('🔍 [USERS] Fetching users list for chat...');
    const users = await User.find({
      username: { $exists: true, $ne: null }
    }, 'username role');
    console.log('👥 [USERS] Found users:', users);
    res.json(users);
  } catch (err) {
    console.error('❌ [USERS] Error fetching users:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;