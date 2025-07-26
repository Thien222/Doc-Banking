class PushNotificationManager {
  constructor() {
    this.isSupported = 'Notification' in window;
    this.permission = this.isSupported ? Notification.permission : 'denied';
  }

  // Yêu cầu quyền thông báo
  async requestPermission() {
    if (!this.isSupported) {
      console.log('Push notifications không được hỗ trợ');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    }

    return false;
  }

  // Gửi thông báo push
  sendNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      return;
    }

    const defaultOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: false,
      silent: false,
      ...options
    };

    const notification = new Notification(title, defaultOptions);

    // Xử lý click vào notification
    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      
      // Mở tab cụ thể nếu có URL
      if (options.url) {
        window.open(options.url, '_blank');
      }
      
      notification.close();
    };

    // Tự động đóng sau 5 giây
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }

  // Gửi thông báo cho hồ sơ mới
  sendHosoNotification(hoso, type) {
    const notifications = {
      'new_hoso': {
        title: '📋 Hồ sơ mới',
        body: `Hồ sơ mới: ${hoso.tenKhachHang} (${hoso.soTaiKhoan})`,
        url: '/customer-manager'
      },
      'hoso_ban_giao': {
        title: '📤 Hồ sơ được bàn giao',
        body: `Hồ sơ ${hoso.soTaiKhoan} đã được bàn giao từ BGD`,
        url: '/qttd-nhan-ban-giao'
      },
      'hoso_nhan_ban_giao': {
        title: '📥 QTTD đã nhận bàn giao',
        body: `QTTD đã nhận bàn giao hồ sơ ${hoso.soTaiKhoan}`,
        url: '/bgd'
      },
      'hoso_tu_choi': {
        title: '❌ Hồ sơ bị từ chối',
        body: `Hồ sơ ${hoso.soTaiKhoan} đã bị từ chối`,
        url: '/customer-manager'
      },
      'hoso_hoan_tra': {
        title: '🔄 Hồ sơ được hoàn trả',
        body: `Hồ sơ ${hoso.soTaiKhoan} đã được hoàn trả`,
        url: '/customer-manager'
      },
      'hoso_nhan_chung_tu': {
        title: '📄 QLKH đã nhận chứng từ',
        body: `QLKH đã nhận chứng từ hồ sơ ${hoso.soTaiKhoan}`,
        url: '/qttd-hoan-tra'
      },
      'hoso_completed': {
        title: '✅ Hồ sơ hoàn thành',
        body: `Hồ sơ ${hoso.soTaiKhoan} đã hoàn thành`,
        url: '/customer-manager'
      }
    };

    const notification = notifications[type];
    if (notification) {
      this.sendNotification(notification.title, {
        body: notification.body,
        url: notification.url,
        tag: `hoso_${hoso._id}`, // Tránh duplicate notifications
        data: {
          hosoId: hoso._id,
          type: type
        }
      });
    }
  }

  // Gửi thông báo chat
  sendChatNotification(message) {
    this.sendNotification('💬 Tin nhắn mới', {
      body: `${message.sender}: ${message.content}`,
      url: '/chat',
      tag: `chat_${message.id}`,
      data: {
        messageId: message.id,
        type: 'chat'
      }
    });
  }

  // Kiểm tra xem có đang focus vào tab không
  isTabFocused() {
    return document.hasFocus();
  }

  // Gửi thông báo chỉ khi không focus
  sendNotificationIfNotFocused(title, options = {}) {
    if (!this.isTabFocused()) {
      this.sendNotification(title, options);
    }
  }
}

// Tạo instance global
const pushNotificationManager = new PushNotificationManager();

export default pushNotificationManager; 