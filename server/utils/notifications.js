let io = null;

// Hàm để set io instance
const setIO = (ioInstance) => {
  io = ioInstance;
};

// Hàm gửi notification đến các role cụ thể
const sendNotification = (targetRoles, notification) => {
  targetRoles.forEach(role => {
    io.to(role).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
      id: Date.now() + Math.random()
    });
  });
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
  HOSO_NHAN_CHUNG_TU: 'hoso_nhan_chung_tu'
};

// Mapping role để nhận notification
const ROLE_NOTIFICATIONS = {
  'quan-ly-khach-hang': {
    receives: ['hoso_ban_giao', 'hoso_hoan_tra', 'hoso_completed', 'hoso_tu_choi'],
    sends: ['new_hoso', 'hoso_updated']
  },
  'ban-giam-doc': {
    receives: ['hoso_nhan_ban_giao', 'hoso_hoan_tra', 'hoso_nhan_chung_tu'],
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
    title: 'Hồ sơ mới',
    message: `Hồ sơ mới được tạo: ${hoso.tenKhachHang} (${hoso.soTaiKhoan})`,
    data: {
      hosoId: hoso._id,
      soTaiKhoan: hoso.soTaiKhoan,
      tenKhachHang: hoso.tenKhachHang,
      trangThai: hoso.trangThai
    }
  };
  
  // Gửi cho BGD và Admin
  sendNotification(['ban-giam-doc', 'admin'], notification);
};

// Hàm tạo notification cho bàn giao hồ sơ
const notifyBanGiao = (hoso, user) => {
  const notification = {
    type: NOTIFICATION_TYPES.HOSO_BAN_GIAO,
    title: 'Hồ sơ được bàn giao',
    message: `Hồ sơ ${hoso.soTaiKhoan} đã được bàn giao từ BGD đến QTTD`,
    data: {
      hosoId: hoso._id,
      soTaiKhoan: hoso.soTaiKhoan,
      tenKhachHang: hoso.tenKhachHang,
      user: user
    }
  };
  
  // Gửi cho QTTD, QLKH và Admin
  sendNotification(['quan-tri-tin-dung', 'quan-ly-khach-hang', 'admin'], notification);
};

// Hàm tạo notification cho từ chối hồ sơ
const notifyTuChoi = (hoso, user, lyDo, role) => {
  const roleName = role === 'ban-giam-doc' ? 'BGD' : 'QTTD';
  const notification = {
    type: NOTIFICATION_TYPES.HOSO_TU_CHOI,
    title: 'Hồ sơ bị từ chối',
    message: `${roleName} đã từ chối hồ sơ ${hoso.soTaiKhoan}: ${lyDo}`,
    data: {
      hosoId: hoso._id,
      soTaiKhoan: hoso.soTaiKhoan,
      tenKhachHang: hoso.tenKhachHang,
      user: user,
      lyDo: lyDo,
      role: role
    }
  };
  
  // Gửi cho QLKH và Admin
  sendNotification(['quan-ly-khach-hang', 'admin'], notification);
};

// Hàm tạo notification cho hoàn trả hồ sơ
const notifyHoanTra = (hoso, user) => {
  const notification = {
    type: NOTIFICATION_TYPES.HOSO_HOAN_TRA,
    title: 'Hồ sơ được hoàn trả',
    message: `Hồ sơ ${hoso.soTaiKhoan} đã được QTTD hoàn trả về QLKH`,
    data: {
      hosoId: hoso._id,
      soTaiKhoan: hoso.soTaiKhoan,
      tenKhachHang: hoso.tenKhachHang,
      user: user
    }
  };
  
  // Gửi cho QLKH và Admin
  sendNotification(['quan-ly-khach-hang', 'admin'], notification);
};

// Hàm tạo notification cho hoàn thành hồ sơ
const notifyCompleted = (hoso, user) => {
  const notification = {
    type: NOTIFICATION_TYPES.HOSO_COMPLETED,
    title: 'Hồ sơ hoàn thành',
    message: `Hồ sơ ${hoso.soTaiKhoan} đã được hoàn thành`,
    data: {
      hosoId: hoso._id,
      soTaiKhoan: hoso.soTaiKhoan,
      tenKhachHang: hoso.tenKhachHang,
      user: user
    }
  };
  
  // Gửi cho tất cả role
  sendNotification(['quan-ly-khach-hang', 'ban-giam-doc', 'quan-tri-tin-dung', 'admin'], notification);
};

// Hàm tạo notification cho QTTD nhận bàn giao
const notifyNhanBanGiao = (hoso, user) => {
  const notification = {
    type: NOTIFICATION_TYPES.HOSO_NHAN_BAN_GIAO,
    title: 'QTTD đã nhận bàn giao',
    message: `QTTD đã nhận bàn giao hồ sơ ${hoso.soTaiKhoan}`,
    data: {
      hosoId: hoso._id,
      soTaiKhoan: hoso.soTaiKhoan,
      tenKhachHang: hoso.tenKhachHang,
      user: user
    }
  };
  
  // Gửi cho BGD
  sendNotification(['ban-giam-doc'], notification);
};

// Hàm tạo notification cho QLKH nhận chứng từ
const notifyNhanChungTu = (hoso, user) => {
  const notification = {
    type: NOTIFICATION_TYPES.HOSO_NHAN_CHUNG_TU,
    title: 'QLKH đã nhận chứng từ',
    message: `QLKH đã nhận chứng từ hồ sơ ${hoso.soTaiKhoan}`,
    data: {
      hosoId: hoso._id,
      soTaiKhoan: hoso.soTaiKhoan,
      tenKhachHang: hoso.tenKhachHang,
      user: user
    }
  };
  
  // Gửi cho QTTD và BGD
  sendNotification(['quan-tri-tin-dung', 'ban-giam-doc'], notification);
};

module.exports = {
  setIO,
  sendNotification,
  NOTIFICATION_TYPES,
  ROLE_NOTIFICATIONS,
  notifyNewHoso,
  notifyBanGiao,
  notifyTuChoi,
  notifyHoanTra,
  notifyCompleted,
  notifyNhanBanGiao,
  notifyNhanChungTu
}; 