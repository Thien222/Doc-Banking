// Simple Tab Manager to prevent session conflicts
class TabManager {
  constructor() {
    this.tabId = this.generateTabId();
    this.init();
  }

  generateTabId() {
    return 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  init() {
    // Store tab ID in localStorage
    localStorage.setItem('currentTabId', this.tabId);
    
    // Listen for storage changes
    window.addEventListener('storage', (e) => {
      if (e.key === 'currentTabId' && e.newValue !== this.tabId) {
        console.log('🔄 [Tab] Another tab is active, clearing session');
        this.clearSession();
      }
    });

    // Clean up on tab close
    window.addEventListener('beforeunload', () => {
      this.clearSession();
    });
  }

  clearSession() {
    // Only clear if this tab's session is still active
    const currentTabId = localStorage.getItem('currentTabId');
    if (currentTabId === this.tabId) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      localStorage.removeItem('currentTabId');
      console.log('🗑️ [Tab] Session cleared for tab:', this.tabId);
    }
  }

  isCurrentTab() {
    return localStorage.getItem('currentTabId') === this.tabId;
  }

  getTabId() {
    return this.tabId;
  }
}

// Create singleton instance
const tabManager = new TabManager();

export default tabManager; 