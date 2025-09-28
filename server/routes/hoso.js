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
// GET /hoso - Lấy danh sách hồ sơ với filter
router.get('/', async (req, res) => {
  try {
    console.log('📋 [HOSO] GET request query:', req.query);
    
    const {
      page = 1,
      limit = 10,
      soTaiKhoan,
      tenKhachHang,
      trangThai,
      phong,
      qlkh,
      fromDate,
      toDate
    } = req.query;

    // Normalize possible array params (when sent both in URL and params)
    const pickFirst = v => Array.isArray(v) ? v[0] : v;
    const soTaiKhoanS = pickFirst(soTaiKhoan);
    const tenKhachHangS = pickFirst(tenKhachHang);
    const trangThaiS = pickFirst(trangThai);
    const phongS = pickFirst(phong);
    const qlkhS = pickFirst(qlkh);
    const fromDateS = pickFirst(fromDate);
    const toDateS = pickFirst(toDate);

    // Build filter object
    const filter = {};
    
    if (typeof soTaiKhoanS === 'string' && soTaiKhoanS.trim()) {
      filter.soTaiKhoan = { $regex: soTaiKhoanS.trim(), $options: 'i' };
    }
    
    if (typeof tenKhachHangS === 'string' && tenKhachHangS.trim()) {
      filter.tenKhachHang = { $regex: tenKhachHangS.trim(), $options: 'i' };
    }
    
    if (typeof trangThaiS === 'string' && trangThaiS.trim()) {
      filter.trangThai = trangThaiS.trim();
    }
    
    if (typeof phongS === 'string' && phongS.trim()) {
      filter.phong = { $regex: phongS.trim(), $options: 'i' };
    }
    
    if (typeof qlkhS === 'string' && qlkhS.trim()) {
      filter.qlkh = { $regex: qlkhS.trim(), $options: 'i' };
    }

    // SỬA: Xử lý date filter đúng cách
    if (fromDateS || toDateS) {
      filter.ngayGiaiNgan = {};
      
      if (typeof fromDateS === 'string' && fromDateS.trim()) {
        try {
          const from = new Date(fromDateS.trim());
          if (!isNaN(from.getTime())) {
            // Set to start of day
            from.setHours(0, 0, 0, 0);
            filter.ngayGiaiNgan.$gte = from;
            console.log('📅 [HOSO] FromDate filter:', from);
          } else {
            console.warn('⚠️ [HOSO] Invalid fromDate:', fromDateS);
          }
        } catch (err) {
          console.warn('⚠️ [HOSO] Error parsing fromDate:', fromDateS, err.message);
        }
      }
      
      if (typeof toDateS === 'string' && toDateS.trim()) {
        try {
          const to = new Date(toDateS.trim());
          if (!isNaN(to.getTime())) {
            // Set to end of day
            to.setHours(23, 59, 59, 999);
            filter.ngayGiaiNgan.$lte = to;
            console.log('📅 [HOSO] ToDate filter:', to);
          } else {
            console.warn('⚠️ [HOSO] Invalid toDate:', toDateS);
          }
        } catch (err) {
          console.warn('⚠️ [HOSO] Error parsing toDate:', toDateS, err.message);
        }
      }
      
      // Nếu không có date filter hợp lệ nào, xóa filter ngayGiaiNgan
      if (Object.keys(filter.ngayGiaiNgan).length === 0) {
        delete filter.ngayGiaiNgan;
      }
    }

    console.log('🔍 [HOSO] Final filter:', JSON.stringify(filter, null, 2));

    // Execute query with pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      HoSo.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(), // SỬA: Dùng lean() để tăng performance
      HoSo.countDocuments(filter)
    ]);

    console.log(`📊 [HOSO] Found ${total} records, returning ${data.length} items for page ${pageNum}`);

    res.json({
      success: true,
      data: data,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });

  } catch (error) {
    console.error('❌ [HOSO] GET Error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi tải hồ sơ: ' + error.message
    });
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

// Test route to check backend health
router.get('/test', async (req, res) => {
  try {
    const count = await HoSo.countDocuments();
    res.json({ 
      message: 'Hoso backend is working', 
      totalRecords: count,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clean up invalid dates in database (ADMIN ONLY)
router.post('/cleanup-dates', async (req, res) => {
  try {
    console.log('🧹 [CLEANUP] Starting date cleanup...');
    
    // Find records with invalid dates
    const invalidRecords = await HoSo.find({
      ngayGiaiNgan: { $type: "date" }
    });
    
    let cleanedCount = 0;
    for (const record of invalidRecords) {
      if (record.ngayGiaiNgan && isNaN(record.ngayGiaiNgan.getTime())) {
        await HoSo.findByIdAndUpdate(record._id, { 
          $unset: { ngayGiaiNgan: "" } 
        });
        cleanedCount++;
        console.log(`🧹 Cleaned invalid date for record: ${record.soTaiKhoan}`);
      }
    }
    
    console.log(`✅ [CLEANUP] Completed. Cleaned ${cleanedCount} records.`);
    res.json({ 
      success: true, 
      message: `Cleaned up ${cleanedCount} invalid dates`,
      cleanedCount 
    });
  } catch (err) {
    console.error('❌ [CLEANUP] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /hoso - Tạo hồ sơ mới
router.post('/', async (req, res) => {
  try {
    console.log('➕ [HOSO] POST request body:', req.body);

    const hosoData = { ...req.body };

    // SỬA: Check cho "Invalid Date" string từ client
    if (hosoData.ngayGiaiNgan === 'Invalid Date') {
      console.warn('⚠️ [HOSO] Client sent Invalid Date string');
      delete hosoData.ngayGiaiNgan;
    }

    // SỬA: Xử lý ngayGiaiNgan đúng cách
    if (hosoData.ngayGiaiNgan) {
      if (typeof hosoData.ngayGiaiNgan === 'string') {
        const date = new Date(hosoData.ngayGiaiNgan);
        if (isNaN(date.getTime())) {
          console.warn('⚠️ [HOSO] Invalid ngayGiaiNgan string:', hosoData.ngayGiaiNgan);
          delete hosoData.ngayGiaiNgan; // Xóa nếu không hợp lệ
        } else {
          hosoData.ngayGiaiNgan = date;
          console.log('📅 [HOSO] Parsed ngayGiaiNgan:', date);
        }
      } else if (hosoData.ngayGiaiNgan instanceof Date) {
        if (isNaN(hosoData.ngayGiaiNgan.getTime())) {
          console.warn('⚠️ [HOSO] Invalid ngayGiaiNgan Date object');
          delete hosoData.ngayGiaiNgan;
        }
      }
    }

    // SỬA: Xử lý soTienGiaiNgan
    if (hosoData.soTienGiaiNgan) {
      const amount = Number(hosoData.soTienGiaiNgan);
      if (isNaN(amount)) {
        console.warn('⚠️ [HOSO] Invalid soTienGiaiNgan:', hosoData.soTienGiaiNgan);
        delete hosoData.soTienGiaiNgan;
      } else {
        hosoData.soTienGiaiNgan = amount;
      }
    }

    console.log('💾 [HOSO] Creating with data:', JSON.stringify(hosoData, null, 2));

    const newHoSo = await HoSo.create(hosoData);
    console.log('✅ [HOSO] Created successfully:', newHoSo._id);
    
    // Gửi notification cho hồ sơ mới
    try {
      console.log('🔔 Sending notification for new hồ sơ...');
      notifyNewHoso(newHoSo);
      console.log('✅ Notification sent for new hồ sơ');
    } catch (notifErr) {
      console.error('❌ Error sending notification:', notifErr);
    }

    res.status(201).json({
      success: true,
      data: newHoSo,
      message: 'Tạo hồ sơ thành công'
    });

  } catch (error) {
    console.error('❌ [HOSO] POST Error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi tạo hồ sơ: ' + error.message
    });
  }
});

// Sửa hồ sơ
router.put('/:id', async (req, res) => {
  try {
    console.log('✏️ Editing hồ sơ:', req.params.id, req.body);
    
    // SỬA: Check cho "Invalid Date" string từ client
    const cleanData = { ...req.body };
    if (cleanData.ngayGiaiNgan === 'Invalid Date') {
      console.warn('⚠️ [HOSO] Client sent Invalid Date string in PUT');
      delete cleanData.ngayGiaiNgan;
    }
    
    // Clean up date fields
    if (cleanData.ngayGiaiNgan) {
      const date = new Date(cleanData.ngayGiaiNgan);
      if (isNaN(date.getTime())) {
        delete cleanData.ngayGiaiNgan; // Remove invalid dates
      } else {
        cleanData.ngayGiaiNgan = date;
      }
    }
    
    const updated = await HoSo.findByIdAndUpdate(req.params.id, cleanData, { new: true });
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

