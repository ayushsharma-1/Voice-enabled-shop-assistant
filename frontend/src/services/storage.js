const STORAGE_KEYS = {
  CURRENT_USER: 'voice_shopping_current_user',
  USER_PREFERENCES: 'voice_shopping_preferences',
  LAST_WISHLIST: 'voice_shopping_last_wishlist',
  THEME: 'voice_shopping_theme'
};

export const storageService = {
  // User Management
  getCurrentUser() {
    try {
      return localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  setCurrentUser(username) {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, username);
      return true;
    } catch (error) {
      console.error('Error setting current user:', error);
      return false;
    }
  },

  // User Preferences
  getUserPreferences() {
    try {
      const prefs = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return prefs ? JSON.parse(prefs) : {
        theme: 'light',
        voiceEnabled: true,
        notifications: true,
        autoRefresh: true
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {
        theme: 'light',
        voiceEnabled: true,
        notifications: true,
        autoRefresh: true
      };
    }
  },

  setUserPreferences(preferences) {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
      return true;
    } catch (error) {
      console.error('Error setting user preferences:', error);
      return false;
    }
  },

  // Theme Management
  getTheme() {
    try {
      return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    } catch (error) {
      console.error('Error getting theme:', error);
      return 'light';
    }
  },

  setTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      return true;
    } catch (error) {
      console.error('Error setting theme:', error);
      return false;
    }
  },

  // Cache Management
  cacheWishlist(username, wishlist) {
    try {
      const key = `${STORAGE_KEYS.LAST_WISHLIST}_${username}`;
      localStorage.setItem(key, JSON.stringify({
        data: wishlist,
        timestamp: Date.now()
      }));
      return true;
    } catch (error) {
      console.error('Error caching wishlist:', error);
      return false;
    }
  },

  getCachedWishlist(username) {
    try {
      const key = `${STORAGE_KEYS.LAST_WISHLIST}_${username}`;
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > 5 * 60 * 1000; // 5 minutes

      return isExpired ? null : data;
    } catch (error) {
      console.error('Error getting cached wishlist:', error);
      return null;
    }
  },

  // Clear all data
  clearAll() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }
};
