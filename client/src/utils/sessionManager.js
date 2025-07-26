// Utility để quản lý session
class SessionManager {
  static checkSession() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || !role) {
      console.log('❌ Session không hợp lệ, redirecting to login');
      window.location.href = '/login';
      return false;
    }
    
    return true;
  }

  static refreshSession() {
    // Lưu thông tin session vào sessionStorage để backup
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    
    if (token && role) {
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('role', role);
      if (username) sessionStorage.setItem('username', username);
    }
  }

  static restoreSession() {
    // Khôi phục session từ sessionStorage nếu localStorage bị mất
    const localToken = localStorage.getItem('token');
    const localRole = localStorage.getItem('role');
    
    if (!localToken || !localRole) {
      const sessionToken = sessionStorage.getItem('token');
      const sessionRole = sessionStorage.getItem('role');
      const sessionUsername = sessionStorage.getItem('username');
      
      if (sessionToken && sessionRole) {
        localStorage.setItem('token', sessionToken);
        localStorage.setItem('role', sessionRole);
        if (sessionUsername) localStorage.setItem('username', sessionUsername);
        console.log('✅ Session restored from sessionStorage');
        return true;
      }
    }
    
    return false;
  }

  static clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('username');
  }
}

export default SessionManager; 