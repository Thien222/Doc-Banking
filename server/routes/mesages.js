const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Lấy số tin nhắn chưa đọc từ từng user gửi đến username
router.get('/unread-count', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    console.log('📬 [MESSAGES] Fetching unread count for:', username);
    const counts = await Message.aggregate([
      { $match: { to: username, read: false } },
      { $group: { _id: '$from', count: { $sum: 1 } } }
    ]);
    console.log('📬 [MESSAGES] Unread counts:', counts);
    res.json(counts);
  } catch (err) {
    console.error('❌ [MESSAGES] Error fetching unread count:', err);
    res.status(500).json({ error: err.message });
  }
});

// Đánh dấu đã đọc khi mở phòng chat
router.post('/mark-read', async (req, res) => {
  try {
    const { from, to } = req.body;
    if (!from || !to) {
      return res.status(400).json({ error: 'From and to are required' });
    }
    
    console.log('✅ [MESSAGES] Marking messages as read from:', from, 'to:', to);
    await Message.updateMany({ from, to, read: false }, { $set: { read: true } });
    res.json({ success: true });
  } catch (err) {
    console.error('❌ [MESSAGES] Error marking as read:', err);
    res.status(500).json({ error: err.message });
  }
});

// Lấy lịch sử chat giữa 2 user
router.get('/history', async (req, res) => {
  try {
    const { user1, user2 } = req.query;
    if (!user1 || !user2) {
      return res.status(400).json({ error: 'User1 and user2 are required' });
    }
    
    console.log('📜 [MESSAGES] Fetching chat history between:', user1, 'and', user2);
    const messages = await Message.find({
      $or: [
        { from: user1, to: user2 },
        { from: user2, to: user1 }
      ]
    }).sort({ timestamp: 1 });
    
    console.log('📜 [MESSAGES] Found messages:', messages.length);
    res.json(messages);
  } catch (err) {
    console.error('❌ [MESSAGES] Error fetching chat history:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;