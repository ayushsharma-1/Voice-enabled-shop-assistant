export const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  DEFAULT_USER: import.meta.env.VITE_DEFAULT_USER
};

// Validate required environment variables
if (!config.API_BASE_URL) {
  console.error('❌ VITE_API_BASE_URL environment variable is not set!');
  throw new Error('VITE_API_BASE_URL environment variable is required');
}

if (!config.DEFAULT_USER) {
  console.error('❌ VITE_DEFAULT_USER environment variable is not set!');
  throw new Error('VITE_DEFAULT_USER environment variable is required');
}

console.log('✅ Environment configuration loaded successfully');
console.log('🌐 API Base URL:', config.API_BASE_URL);
console.log('👤 Default User:', config.DEFAULT_USER);
