class PushNotificationManager {
  constructor() {
    this.isFocused = true;
    this.setupFocusListeners();
  }

  setupFocusListeners() {
    // Listen for window focus/blur events
    window.addEventListener('focus', () => {
      this.isFocused = true;
      console.log('📱 Tab focused');
    });

    window.addEventListener('blur', () => {
      this.isFocused = false;
      console.log('📱 Tab blurred');
    });

    // Listen for visibility change
    document.addEventListener('visibilitychange', () => {
      this.isFocused = !document.hidden;
      console.log(`📱 Tab ${this.isFocused ? 'visible' : 'hidden'}`);
    });
  }

  isTabFocused() {
    return this.isFocused && !document.hidden;
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('❌ This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      console.log('✅ Notification permission already granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('❌ Notification permission denied by user');
      return false;
    }

    try {
      console.log('🔔 Requesting notification permission...');
      const permission = await Notification.requestPermission();
      console.log('🔔 Permission result:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Auto request permission when app starts
  async initializeNotifications() {
    console.log('🔔 Initializing notifications...');
    const hasPermission = await this.requestPermission();
    if (hasPermission) {
      console.log('✅ Notifications initialized successfully');
    } else {
      console.log('⚠️ Notifications not available - permission denied');
    }
    return hasPermission;
  }

  sendNotification(title, options = {}) {
    if (!this.isTabFocused() && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'chat-notification',
        requireInteraction: false,
        silent: false,
        ...options
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    }
  }

  sendChatNotification(message) {
    const title = `Tin nhắn mới từ ${message.from}`;
    const options = {
      body: message.content.length > 100 
        ? message.content.substring(0, 100) + '...' 
        : message.content,
      tag: `chat-${message.from}`,
      data: {
        type: 'chat',
        from: message.from,
        messageId: message._id || message.id
      }
    };

    this.sendNotification(title, options);
  }

  sendSystemNotification(title, message, type = 'info') {
    const options = {
      body: message,
      tag: `system-${type}`,
      data: {
        type: 'system',
        notificationType: type
      }
    };

    this.sendNotification(title, options);
  }

  // Play notification sound
  playNotificationSound() {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => {
        console.log('Audio play failed:', err);
      });
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  // Vibrate device if supported
  vibrateDevice() {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }

  // Send notification with sound and vibration
  sendNotificationWithFeedback(title, options = {}) {
    const notification = this.sendNotification(title, options);
    
    if (notification) {
      this.playNotificationSound();
      this.vibrateDevice();
    }
    
    return notification;
  }
}

const pushNotificationManager = new PushNotificationManager();

export default pushNotificationManager; 