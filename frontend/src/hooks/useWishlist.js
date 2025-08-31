import { useState, useCallback, useEffect } from 'react';
import { wishlistAPI } from '../services/api.js';
import { storageService } from '../services/storage.js';
import { useUser } from '../contexts/UserContext.jsx';

export const useWishlist = () => {
  const { currentUser } = useUser();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load wishlist from cache or API
  const loadWishlist = useCallback(async (forceRefresh = false) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      // Try to load from cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = storageService.getCachedWishlist(currentUser);
        if (cached) {
          setWishlist(cached);
          setLoading(false);
          return;
        }
      }

      // Load from API
      const response = await wishlistAPI.getWishlist(currentUser);
      console.log('Load wishlist response:', response);
      
      if (response.error) {
        throw new Error(response.error);
      }

      const wishlistData = response.wishlist || [];
      console.log('Setting wishlist from load:', wishlistData);
      setWishlist(wishlistData);
      
      // Cache the result
      storageService.cacheWishlist(currentUser, wishlistData);

    } catch (error) {
      setError(error.message);
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Update wishlist with voice command result
  const updateWishlist = useCallback(async (llmResponse) => {
    if (!currentUser) {
      throw new Error('No user selected');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await wishlistAPI.updateWishlist(currentUser, llmResponse);
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Force reload wishlist from API immediately
      const updatedWishlist = await wishlistAPI.getWishlist(currentUser);
      console.log('Updated wishlist from API:', updatedWishlist);
      
      if (updatedWishlist.error) {
        throw new Error(updatedWishlist.error);
      }
      
      const wishlistData = updatedWishlist.wishlist || [];
      console.log('Setting wishlist data:', wishlistData);
      setWishlist(wishlistData);
      storageService.cacheWishlist(currentUser, wishlistData);
      
      return response;

    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Manual add item to wishlist
  const addItem = useCallback(async (product, quantity = 1, category = 'unknown') => {
    const llmResponse = {
      product,
      quantity: parseInt(quantity),
      category,
      action: 'add',
      status: 'manual'
    };

    return await updateWishlist(llmResponse);
  }, [updateWishlist]);

  // Manual remove item from wishlist
  const removeItem = useCallback(async (product) => {
    const llmResponse = {
      product,
      quantity: 1,
      category: 'unknown',
      action: 'remove',
      status: 'manual'
    };

    return await updateWishlist(llmResponse);
  }, [updateWishlist]);

  // Clear entire wishlist
  const clearWishlist = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      // Remove all items one by one (backend limitation)
      const itemsToRemove = [...wishlist];
      
      for (const item of itemsToRemove) {
        const llmResponse = {
          product: item.product,
          quantity: 1,
          category: item.category,
          action: 'delete',
          status: 'manual'
        };
        
        await wishlistAPI.updateWishlist(currentUser, llmResponse);
      }

      setWishlist([]);
      storageService.cacheWishlist(currentUser, []);

    } catch (error) {
      setError(error.message);
      console.error('Error clearing wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, wishlist]);

  // Filter wishlist by category
  const filteredWishlist = useCallback(() => {
    let filtered = wishlist;

    // Apply category filter
    if (filter !== 'all') {
      filtered = filtered.filter(item => item.category === filter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.product.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [wishlist, filter, searchTerm]);

  // Get wishlist statistics
  const getStats = useCallback(() => {
    const total = wishlist.length;
    const categories = {};
    let totalQuantity = 0;

    wishlist.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + 1;
      totalQuantity += item.quantity || 1;
    });

    return {
      total,
      totalQuantity,
      categories,
      categoryCount: Object.keys(categories).length
    };
  }, [wishlist]);

  // Load wishlist when user changes
  useEffect(() => {
    if (currentUser) {
      loadWishlist();
    } else {
      setWishlist([]);
    }
  }, [currentUser, loadWishlist]);

  // Auto-refresh wishlist every 10 seconds for real-time updates
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      loadWishlist(true); // Force refresh from API
    }, 10000); // 10 seconds for more responsive updates

    return () => clearInterval(interval);
  }, [currentUser, loadWishlist]);

  return {
    wishlist,
    filteredWishlist: filteredWishlist(),
    loading,
    error,
    filter,
    searchTerm,
    stats: getStats(),
    loadWishlist,
    updateWishlist,
    addItem,
    removeItem,
    clearWishlist,
    setFilter,
    setSearchTerm,
    setError: (error) => setError(error)
  };
};
