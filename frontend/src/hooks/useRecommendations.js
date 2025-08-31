import { useState, useCallback, useEffect } from 'react';
import { recommendationsAPI } from '../services/api.js';
import { useUser } from '../contexts/UserContext.jsx';

export const useRecommendations = () => {
  const { currentUser } = useUser();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load recommendations from API
  const loadRecommendations = useCallback(async (forceRefresh = false) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      const response = await recommendationsAPI.getRecommendations(currentUser);
      
      if (response.error) {
        throw new Error(response.error);
      }

      const recommendationsData = response.recommendations || [];
      setRecommendations(recommendationsData);
      setLastUpdated(new Date());

    } catch (error) {
      setError(error.message);
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Refresh recommendations
  const refreshRecommendations = useCallback(async () => {
    await loadRecommendations(true);
  }, [loadRecommendations]);

  // Get recommendations by category
  const getRecommendationsByCategory = useCallback((category) => {
    if (!category || category === 'all') {
      return recommendations;
    }
    return recommendations.filter(rec => rec.category === category);
  }, [recommendations]);

  // Get recommendations statistics
  const getRecommendationStats = useCallback(() => {
    const total = recommendations.length;
    const categories = {};
    let totalPrice = 0;

    recommendations.forEach(rec => {
      categories[rec.category] = (categories[rec.category] || 0) + 1;
      totalPrice += rec.price || 0;
    });

    return {
      total,
      totalPrice,
      categories,
      categoryCount: Object.keys(categories).length,
      averagePrice: total > 0 ? totalPrice / total : 0
    };
  }, [recommendations]);

  // Check if recommendations are stale (older than 5 minutes)
  const areRecommendationsStale = useCallback(() => {
    if (!lastUpdated) return true;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastUpdated < fiveMinutesAgo;
  }, [lastUpdated]);

  // Auto-refresh stale recommendations
  const autoRefreshIfStale = useCallback(async () => {
    if (areRecommendationsStale()) {
      await refreshRecommendations();
    }
  }, [areRecommendationsStale, refreshRecommendations]);

  // Load recommendations when user changes
  useEffect(() => {
    if (currentUser) {
      loadRecommendations();
    } else {
      setRecommendations([]);
      setLastUpdated(null);
    }
  }, [currentUser, loadRecommendations]);

  // Auto-refresh timer
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      autoRefreshIfStale();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [currentUser, autoRefreshIfStale]);

  return {
    recommendations,
    loading,
    error,
    lastUpdated,
    stats: getRecommendationStats(),
    loadRecommendations,
    refreshRecommendations,
    getRecommendationsByCategory,
    areRecommendationsStale,
    autoRefreshIfStale,
    setError: (error) => setError(error)
  };
};
