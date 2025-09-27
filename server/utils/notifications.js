let io = null;

// Hàm để set io instance
const setIO = (ioInstance) => {
  io = ioInstance;
};

// Hàm gửi notification đến các role cụ thể
const sendNotification = (targetRoles, notification) => {
  console.log('🔔 [SERVER] Gửi notification tới roles:', targetRoles);
  console.log('🔔 [SERVER] Notification content:', notification);
  
  if (!io) {
    console.log('❌ [SERVER] No Socket.IO instance available');
    return;
  }
  
  // Log tất cả rooms hiện tại
  const rooms = io.sockets.adapter.rooms;

  
  targetRoles.forEach(role => {
    
    
    // Kiểm tra xem có ai trong room không
          const room = rooms.get(role);
      io.to(role).emit('notification', notification);
  });
  
  console.log('✅ [SERVER] Notification sent successfully');
};

// Các loại notification
const NOTIFICATION_TYPES = {
  NEW_HOSO: 'new_hoso',
  HOSO_UPDATED: 'hoso_updated',
  HOSO_BAN_GIAO: 'hoso_ban_giao',
  HOSO_TU_CHOI: 'hoso_tu_choi',
  HOSO_HOAN_TRA: 'hoso_hoan_tra',
  HOSO_COMPLETED: 'hoso_completed',
  HOSO_NHAN_BAN_GIAO: 'hoso_nhan_ban_giao',
  HOSO_NHAN_CHUNG_TU: 'hoso_nhan_chung_tu',
  HOSO_EDITED: 'hoso_edited',
  HOSO_DELETED: 'hoso_deleted'
};

// Mapping role để nhận notification
const ROLE_NOTIFICATIONS = {
  'quan-ly-khach-hang': {
    receives: ['hoso_ban_giao', 'hoso_hoan_tra', 'hoso_completed', 'hoso_tu_choi'],
    sends: ['new_hoso', 'hoso_updated']
  },
  'ban-giam-doc': {
    receives: ['new_hoso', 'hoso_nhan_ban_giao', 'hoso_hoan_tra', 'hoso_nhan_chung_tu'],
    sends: ['hoso_ban_giao', 'hoso_tu_choi']
  },
  'quan-tri-tin-dung': {
    receives: ['hoso_ban_giao', 'hoso_nhan_chung_tu'],
    sends: ['hoso_nhan_ban_giao', 'hoso_hoan_tra', 'hoso_tu_choi']
  },
  'quan-ly-giao-dich': {
    receives: ['hoso_ban_giao', 'hoso_tu_choi', 'hoso_hoan_tra', 'hoso_completed'],
    sends: ['hoso_nhan_chung_tu']
  },
  'admin': {
    receives: ['new_hoso', 'hoso_updated', 'hoso_ban_giao', 'hoso_tu_choi', 'hoso_hoan_tra', 'hoso_completed'],
    sends: []
  }
};

// Hàm tạo notification cho hồ sơ mới
const notifyNewHoso = (hoso) => {
  const notification = {
    type: NOTIFICATION_TYPES.NEW_HOSO,
    title: '📋 Hồ sơ mới được tạo',
    message: `QLKH đã tạo hồ sơ mới: ${hoso.tenKhachHang} (${hoso.soTaiKhoan})`,
    data: {
      hosoId: hoso._id,
      soTaiKhoan: hoso.soTaiKhoan,
      tenKhachHang: hoso.tenKhachHang,
      trangThai: hoso.trangThai
    }
  };
  // Chỉ gửi cho BGD (người cần xem và bàn giao)
  sendNotification(['ban-giam-doc'], notification);
};

// Hàm tạo notification cho bàn giao hồ sơ
const notifyBanGiao = (hoso, user) => {
  const notification = {
    type: NOTIFICATION_TYPES.HOSO_BAN_GIAO,
    title: '📤 Hồ sơ được bàn giao',
    message: `BGD đã bàn giao hồ sơ ${hoso.soTaiKhoan} cho QTTD xử lý`,
    data: {
      hosoId: hoso._id,
      soTaiKhoan: hoso.soTaiKhoan,
      tenKhachHang: hoso.tenKhachHang,
      user: user
    }
  };
  // Gửi cho QTTD (người nhận) và QLKH (người tạo)
  sendNotification(['quan-tri-tin-dung', 'quan-ly-khach-hang'], notification);
};

// Hàm tạo notification cho từ chối hồ sơ
const notifyTuChoi = (hoso, user, lyDo, role) => {
  const roleName = role === 'ban-giam-doc' ? 'BGD' : 'QTTD';
  const notification = {
    type: NOTIFICATION_TYPES.HOSO_TU_CHOI,
    title: '❌ Hồ sơ bị từ chối',
    message: `${roleName} đã từ chối hồ sơ ${hoso.soTaiKhoan}\nLý do: ${lyDo}`,
    data: {
      hosoId: hoso._id,
      soTaiKhoan: hoso.soTaiKhoan,
      tenKhachHang: hoso.tenKhachHang,
      user: user,
      lyDo: lyDo,
      role: role
    }
  };
  

  
  if (role === 'ban-giam-doc') {
    // BGD từ chối → Chỉ QLKH cần biết
    sendNotification(['quan-ly-khach-hang'], notification);
  } else {
    // QTTD từ chối → QLKH cần biết để xử lý
    sendNotification(['quan-ly-khach-hang'], notification);
  }
};

// Hàm tạo notification cho hoàn trả hồ sơ
const notifyHoanTra = (hoso, user) => {
  const notification = {
    type: NOTIFICATION_TYPES.HOSO_HOAN_TRA,
    title: '🔄 Hồ sơ được hoàn trả',
    message: `QTTD đã hoàn trả hồ sơ ${hoso.soTaiKhoan} về QLKH để bổ sung`,
    data: {
      hosoId: hoso._id,
      soTaiKhoan: hoso.soTaiKhoan,
      tenKhachHang: hoso.tenKhachHang,
      user: user
    }
  };
  

  // Chỉ QLKH cần biết để xử lý
  sendNotification(['quan-ly-khach-hang'], notification);
};

// Hàm tạo notification cho hoàn thành hồ sơ
const notifyCompleted = (hoso, user) => {
  const notification = {
    type: NOTIFICATION_TYPES.HOSO_COMPLETED,
    title: '✅ Hồ sơ hoàn thành',
    message: `Hồ sơ ${hoso.soTaiKhoan} đã được xử lý hoàn tất`,
    data: {
      hosoId: hoso._id,
      soTaiKhoan: hoso.soTaiKhoan,
      tenKhachHang: hoso.tenKhachHang,
      user: user
    }
  };
  // Gửi cho tất cả role để thông báo hoàn thành
  sendNotification(['quan-ly-khach-hang', 'quan-tri-tin-dung', 'ban-giam-doc'], notification);
};

// Hàm tạo notification cho QTTD nhận bàn giao
const notifyNhanBanGiao = (hoso, user) => {
  const notification = {
    type: NOTIFICATION_TYPES.HOSO_NHAN_BAN_GIAO,
    title: '✅ QTTD đã nhận bàn giao',
    message: `QTTD đã nhận và bắt đầu xử lý hồ sơ ${hoso.soTaiKhoan}`,
    data: {
      hosoId: hoso._id,
      soTaiKhoan: hoso.soTaiKhoan,
      tenKhachHang: hoso.tenKhachHang,
      user: user
    }
  };
  
  // Chỉ BGD cần biết (người đã bàn giao)
  sendNotification(['ban-giam-doc'], notification);
};

// Hàm tạo notification cho QLKH nhận chứng từ
const notifyNhanChungTu = (hoso, user) => {
  const notification = {
    type: NOTIFICATION_TYPES.HOSO_NHAN_CHUNG_TU,
    title: '📄 QLKH đã nhận chứng từ',
    message: `QLKH đã xác nhận nhận đủ chứng từ hồ sơ ${hoso.soTaiKhoan}`,
    data: {
      hosoId: hoso._id,
      soTaiKhoan: hoso.soTaiKhoan,
      tenKhachHang: hoso.tenKhachHang,
      user: user
    }
  };
  
  // QTTD và BGD cần biết để theo dõi tiến độ
  sendNotification(['quan-tri-tin-dung', 'ban-giam-doc'], notification);
};

// Hàm tạo notification cho chỉnh sửa hồ sơ
const notifyEditHoso = (hoso, user) => {
  const notification = {
    type: NOTIFICATION_TYPES.HOSO_EDITED,
    title: '✏️ Hồ sơ được chỉnh sửa',
    message: `QLKH đã cập nhật thông tin hồ sơ ${hoso.soTaiKhoan}`,
    data: {
      hosoId: hoso._id,
      soTaiKhoan: hoso.soTaiKhoan,
      tenKhachHang: hoso.tenKhachHang,
      user: user
    }
  };
  // Chỉ BGD cần biết để xem lại
  sendNotification(['ban-giam-doc'], notification);
};

// Hàm tạo notification cho xóa hồ sơ
const notifyDeleteHoso = (hoso, user) => {
  const notification = {
    type: NOTIFICATION_TYPES.HOSO_DELETED,
    title: '🗑️ Hồ sơ bị xóa',
    message: `QLKH đã xóa hồ sơ ${hoso.soTaiKhoan}`,
    data: {
      hosoId: hoso._id,
      soTaiKhoan: hoso.soTaiKhoan,
      tenKhachHang: hoso.tenKhachHang,
      user: user
    }
  };
  // Tất cả role cần biết
  sendNotification(['ban-giam-doc', 'quan-tri-tin-dung'], notification);
};

module.exports = {
  setIO,
  notifyNewHoso,
  notifyBanGiao,
  notifyTuChoi,
  notifyHoanTra,
  notifyCompleted,
  notifyNhanBanGiao,
  notifyNhanChungTu,
  notifyEditHoso,
  notifyDeleteHoso
}; 