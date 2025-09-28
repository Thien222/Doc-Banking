const express = require('express');
const router = express.Router();
const HoSo = require('../models/HoSo');
const { notifyNewHoso, notifyBanGiao, notifyTuChoi, notifyHoanTra, notifyCompleted, notifyNhanBanGiao, notifyNhanChungTu, notifyEditHoso, notifyDeleteHoso } = require('../utils/notifications');

// Lấy thống kê tổng quan
router.get('/stats', async (req, res) => {
  try {
    const total = await HoSo.countDocuments();
    const processing = await HoSo.countDocuments({ 
      trangThai: { 
        $in: ['moi', 'dang-xu-ly', 'qttd-da-nhan', 'qttd-hoan-tra'] 
      } 
    });
    const completed = await HoSo.countDocuments({ 
      trangThai: { 
        $in: ['hoan-tat', 'hoan-thanh'] 
      } 
    });
    
    res.json({
      success: true,
      data: {
        total,
        processing,
        completed
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Lấy danh sách hồ sơ (có filter, phân trang)
router.get('/', async (req, res) => {
  try {
    console.log('📋 [HOSO] GET request with query:', req.query);
    const { page = 1, limit = 10, search = '', trangThai, soTaiKhoan, tenKhachHang, qlkh, phong, fromDate, toDate } = req.query;
    const filter = {};
    if (trangThai) filter.trangThai = trangThai;
    if (soTaiKhoan) filter.soTaiKhoan = { $regex: soTaiKhoan, $options: 'i' };
    if (tenKhachHang) filter.tenKhachHang = { $regex: tenKhachHang, $options: 'i' };
    if (qlkh) filter.qlkh = { $regex: qlkh, $options: 'i' };
    if (phong) filter.phong = { $regex: phong, $options: 'i' };
    if (fromDate || toDate) {
      filter.ngayGiaiNgan = {};
      if (fromDate) filter.ngayGiaiNgan.$gte = new Date(fromDate);
      if (toDate) filter.ngayGiaiNgan.$lte = new Date(toDate);
    }
    if (search) {
      filter.$or = [
        { soTaiKhoan: { $regex: search, $options: 'i' } },
        { tenKhachHang: { $regex: search, $options: 'i' } },
        { qlkh: { $regex: search, $options: 'i' } },
        { phong: { $regex: search, $options: 'i' } }
      ];
    }
    console.log('📋 [HOSO] Filter applied:', filter);
    const total = await HoSo.countDocuments(filter);
    console.log('📋 [HOSO] Total count:', total);
    const data = await HoSo.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    console.log('📋 [HOSO] Found records:', data.length);
    res.json({ data, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint test: trả về toàn bộ hồ sơ không filter gì
router.get('/all', async (req, res) => {
  try {
    const data = await HoSo.find({}).sort({ createdAt: -1 });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Thêm mới hồ sơ
router.post('/', async (req, res) => {
  try {
    console.log('📝 Creating new hồ sơ:', req.body);
    
    // Kiểm tra các field bắt buộc
    if (!req.body.soTaiKhoan) {
      return res.status(400).json({ error: 'Số tài khoản là bắt buộc' });
    }
    if (!req.body.tenKhachHang) {
      return res.status(400).json({ error: 'Tên khách hàng là bắt buộc' });
    }
    
    const hoso = new HoSo(req.body);
    const saved = await hoso.save();
    console.log('✅ Hồ sơ created successfully:', saved._id);
    
    // Gửi notification cho hồ sơ mới
    try {
      console.log('🔔 Sending notification for new hồ sơ...');
      notifyNewHoso(saved);
      console.log('✅ Notification sent for new hồ sơ');
    } catch (notifErr) {
      console.error('❌ Error sending notification:', notifErr);
    }
    
    res.status(201).json(saved);
  } catch (err) {
    console.error('❌ Error creating hồ sơ:', err);
    res.status(400).json({ error: err.message });
  }
});

// Sửa hồ sơ
router.put('/:id', async (req, res) => {
  try {
    console.log('✏️ Editing hồ sơ:', req.params.id, req.body);
    
    const updated = await HoSo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy hồ sơ' });
    
    console.log('✅ Hồ sơ đã được cập nhật:', updated.soTaiKhoan);
    
    // Gửi notification cập nhật hồ sơ
    try {
      console.log('🔔 Sending notification for hồ sơ edit...');
      notifyEditHoso(updated, req.body.user || '');
      console.log('✅ Notification sent for hồ sơ edit');
    } catch (notifErr) {
      console.error('❌ Error sending notification:', notifErr);
    }
    
    res.json(updated);
  } catch (err) {
    console.error('❌ Error editing hồ sơ:', err);
    res.status(400).json({ error: err.message });
  }
});

// Xóa hồ sơ
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️ Deleting hồ sơ:', req.params.id);
    
    const deleted = await HoSo.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Không tìm thấy hồ sơ' });
    
    console.log('✅ Hồ sơ đã được xóa:', deleted.soTaiKhoan);
    
    // Gửi notification xóa hồ sơ
    try {
      console.log('🔔 Sending notification for hồ sơ delete...');
      notifyDeleteHoso(deleted, req.body.user || '');
      console.log('✅ Notification sent for hồ sơ delete');
    } catch (notifErr) {
      console.error('❌ Error sending notification:', notifErr);
    }
    
    res.json({ message: 'Đã xóa hồ sơ' });
  } catch (err) {
    console.error('❌ Error deleting hồ sơ:', err);
    res.status(400).json({ error: err.message });
  }
});

// Bàn giao hồ sơ (BGD -> QTTD)
router.put('/:id/ban-giao', async (req, res) => {
  try {
    const updated = await HoSo.findByIdAndUpdate(
      req.params.id,
      {
        trangThai: 'dang-xu-ly',
        'banGiao.daBanGiao': true,
        'banGiao.user': req.body.user,
        'banGiao.ghiChu': req.body.ghiChu || '',
        // Đảm bảo nhanGiao.daNhan là false hoặc undefined khi bàn giao
        $unset: { 'nhanGiao.daNhan': '' }
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy hồ sơ' });
    // Gửi notification cho bàn giao hồ sơ
    notifyBanGiao(updated, req.body.user);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Lấy danh sách hồ sơ chờ QTTD nhận
router.get('/cho-qttd-nhan', async (req, res) => {
  try {
    // Có thể dùng trạng thái 'cho-qttd-nhan' hoặc 'dang-xu-ly' tùy quy ước
    const data = await HoSo.find({ trangThai: 'dang-xu-ly', 'banGiao.daBanGiao': true, 'nhanGiao.daNhan': { $ne: true } }).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy danh sách hồ sơ chờ QLKH nhận chứng từ
router.get('/cho-qlkh-nhan-chung-tu', async (req, res) => {
  try {
    const data = await HoSo.find({ 
      trangThai: 'qttd-hoan-tra', 
      'hoanTra.daHoanTra': true, 
      'nhanChungTu.daNhan': { $ne: true } 
    }).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// QTTD xác nhận nhận hồ sơ
router.post('/:id/nhan', async (req, res) => {
  try {
    console.log('✅ QTTD nhận bàn giao hồ sơ:', req.params.id, req.body);
    
    const updated = await HoSo.findByIdAndUpdate(
      req.params.id,
      {
        trangThai: 'qttd-da-nhan',
        'nhanGiao.daNhan': true,
        'nhanGiao.user': req.body.user || '',
        'nhanGiao.ghiChu': req.body.ghiChu || ''
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy hồ sơ' });
    
    console.log('✅ Hồ sơ đã được cập nhật trạng thái:', updated.trangThai);
    
    // Gửi notification cho QTTD nhận bàn giao
    try {
      console.log('🔔 Sending notification for QTTD nhan ban giao...');
    notifyNhanBanGiao(updated, req.body.user || '');
      console.log('✅ Notification sent for QTTD nhan ban giao');
    } catch (notifErr) {
      console.error('❌ Error sending notification:', notifErr);
    }
    
    res.json(updated);
  } catch (err) {
    console.error('❌ Error in QTTD nhan ban giao:', err);
    res.status(400).json({ error: err.message });
  }
});

// BGD từ chối hồ sơ
router.post('/:id/bgd-tu-choi', async (req, res) => {
  try {
    const updated = await HoSo.findByIdAndUpdate(
      req.params.id,
      {
        trangThai: 'bgd-tu-choi',
        'bgdTuChoi.daTuChoi': true,
        'bgdTuChoi.user': req.body.user || '',
        'bgdTuChoi.lyDo': req.body.lyDo || ''
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy hồ sơ' });
    
    // Gửi notification cho từ chối hồ sơ
    try {
      notifyTuChoi(updated, req.body.user || '', req.body.lyDo || '', 'ban-giam-doc');
    } catch (notifErr) {
      console.error('❌ Error sending notification:', notifErr);
    }
    
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// QTTD từ chối nhận hồ sơ
router.post('/:id/qttd-tu-choi', async (req, res) => {
  try {

    const updated = await HoSo.findByIdAndUpdate(
      req.params.id,
      {
        trangThai: 'qttd-tu-choi',
        'qttdTuChoi.daTuChoi': true,
        'qttdTuChoi.user': req.body.user || '',
        'qttdTuChoi.lyDo': req.body.lyDo || ''
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy hồ sơ' });
    // Gửi notification cho từ chối hồ sơ
    try {
      notifyTuChoi(updated, req.body.user || '', req.body.lyDo || '', 'quan-tri-tin-dung');
    } catch (notifErr) {
      console.error('❌ Error sending notification:', notifErr);
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// QTTD hoàn trả hồ sơ về QLKH
router.post('/:id/hoan-tra', async (req, res) => {
  try {
    const before = await HoSo.findById(req.params.id);
    if (!before) return res.status(404).json({ error: 'Không tìm thấy hồ sơ' });
    // Chỉ update các trường trạng thái, giữ nguyên mọi trường khác
    before.trangThai = 'qttd-hoan-tra';
    before.hoanTra = {
      daHoanTra: true,
      user: req.body.user || '',
      ghiChu: req.body.note || ''
    };
    await before.save();
    // Gửi notification cho hoàn trả hồ sơ
    try {
      notifyHoanTra(before, req.body.user || '');
    } catch (notifErr) {
      console.error('❌ Error sending notification:', notifErr);
    }
    res.json(before);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// QLKH xác nhận đã nhận đủ chứng từ
router.post('/:id/xac-nhan-nhan-chung-tu', async (req, res) => {
  try {
    const updated = await HoSo.findByIdAndUpdate(
      req.params.id,
      {
        trangThai: 'hoan-tat', // hoặc 'qlkh-da-nhan'
        'nhanChungTu.daNhan': true,
        'nhanChungTu.user': req.body.user || '',
        'nhanChungTu.ghiChu': req.body.note || ''
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy hồ sơ' });
    
    // Gửi notification cho QLKH nhận chứng từ
    notifyNhanChungTu(updated, req.body.user || '');
    
    // Gửi notification cho hoàn thành hồ sơ
    notifyCompleted(updated, req.body.user || '');
    
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// QLKH từ chối nhận chứng từ
router.post('/:id/tu-choi-nhan-chung-tu', async (req, res) => {
  try {
    const updated = await HoSo.findByIdAndUpdate(
      req.params.id,
      {
        trangThai: 'qlkh-tu-choi-nhan',
        'nhanChungTu.daNhan': false,
        'nhanChungTu.user': req.body.user || '',
        'nhanChungTu.ghiChu': req.body.note || ''
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy hồ sơ' });
    // Gửi notification cho QLKH từ chối nhận chứng từ
    try { require('../utils/notifications').sendNotification(['admin', 'ban-giam-doc', 'quan-tri-tin-dung'], { type: 'qlkh_tu_choi_nhan_chung_tu', title: 'QLKH từ chối nhận chứng từ', message: `QLKH đã từ chối nhận chứng từ hồ sơ ${updated.soTaiKhoan}`, data: { hosoId: updated._id } }); } catch(e){}
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


module.exports = router; 

