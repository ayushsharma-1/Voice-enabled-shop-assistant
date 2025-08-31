// Color Scheme
export const COLORS = {
  primary: '#3498db',
  primaryLight: '#5dade2',
  primaryDark: '#2980b9',
  secondary: '#2ecc71',
  secondaryLight: '#58d68d',
  secondaryDark: '#27ae60',
  accent: '#f39c12',
  accentLight: '#f7dc6f',
  accentDark: '#e67e22',
  success: '#27ae60',
  warning: '#f39c12',
  error: '#e74c3c',
  info: '#3498db',
  light: '#ecf0f1',
  dark: '#2c3e50',
  white: '#ffffff',
  gray: '#95a5a6',
  grayLight: '#bdc3c7',
  grayDark: '#7f8c8d',
  background: '#f8f9fa',
  surface: '#ffffff',
  text: '#2c3e50',
  textSecondary: '#7f8c8d'
};

// Product Categories
export const CATEGORIES = {
  dairy: {
    name: 'Dairy',
    color: '#e8f4fd',
    icon: '🥛',
    description: 'Milk, cheese, yogurt, and other dairy products'
  },
  fruit: {
    name: 'Fruits',
    color: '#f0f8e8',
    icon: '🍎',
    description: 'Fresh fruits and berries'
  },
  drinks: {
    name: 'Drinks',
    color: '#fff8e1',
    icon: '🥤',
    description: 'Beverages and juices'
  },
  snacks: {
    name: 'Snacks',
    color: '#fce4ec',
    icon: '🍿',
    description: 'Snacks and treats'
  },
  grains: {
    name: 'Grains',
    color: '#f3e5f5',
    icon: '🌾',
    description: 'Rice, flour, oats, and grains'
  }
};

// Voice Commands Examples
export const VOICE_EXAMPLES = [
  "Add 2 apples to my wishlist",
  "Remove milk from wishlist",
  "Add 3 bottles of orange juice",
  "Delete chocolate bar",
  "Add 1 kg rice",
  "Remove all bananas"
];

// Animation Durations
export const ANIMATIONS = {
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 800
};

// API Endpoints
export const ENDPOINTS = {
  VOICE_PROCESS: '/recognise_text_to_llm',
  UPDATE_WISHLIST: '/update_wishlist',
  GET_WISHLIST: '/wishlist',
  GET_RECOMMENDATIONS: '/recommendations'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  CURRENT_USER: 'voice_shopping_current_user',
  USER_PREFERENCES: 'voice_shopping_preferences',
  LAST_WISHLIST: 'voice_shopping_last_wishlist',
  THEME: 'voice_shopping_theme'
};

// Error Messages
export const ERROR_MESSAGES = {
  VOICE_PERMISSION: 'Microphone permission is required for voice commands',
  VOICE_PROCESSING: 'Failed to process voice command. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_COMMAND: 'Invalid command. Please try a different phrase.',
  PRODUCT_NOT_FOUND: 'Product not found in store.',
  INSUFFICIENT_STOCK: 'Insufficient stock available.',
  UNKNOWN_ERROR: 'An unexpected error occurred.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  PRODUCT_ADDED: 'Product added to wishlist successfully!',
  PRODUCT_REMOVED: 'Product removed from wishlist successfully!',
  WISHLIST_UPDATED: 'Wishlist updated successfully!',
  VOICE_PROCESSED: 'Voice command processed successfully!'
};
