import axios from 'axios';
import { config } from '../config/env.js';

const API_BASE = config.API_BASE_URL;

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // 30 seconds timeout for voice processing
  headers: {
    'Content-Type': 'application/json',
  },
});

// Voice Command Processing
export const voiceAPI = {
  processVoice: async (audioFile) => {
    const formData = new FormData();
    formData.append('file', audioFile);
    
    try {
      const response = await api.post('/recognise_text_to_llm', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Voice processing failed');
    }
  },
};

// Wishlist Management
export const wishlistAPI = {
  updateWishlist: async (username, llmResponse) => {
    try {
      const response = await api.post(`/update_wishlist/${username}`, llmResponse);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update wishlist');
    }
  },

  getWishlist: async (username) => {
    try {
      const response = await api.get(`/wishlist/${username}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch wishlist');
    }
  },
};

// Recommendations
export const recommendationsAPI = {
  getRecommendations: async (username) => {
    try {
      const response = await api.get(`/recommendations/${username}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch recommendations');
    }
  },
};

// Store Management
export const storeAPI = {
  getStoreItems: async () => {
    try {
      const response = await api.get('/store');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch store items');
    }
  },
};

export default api;
