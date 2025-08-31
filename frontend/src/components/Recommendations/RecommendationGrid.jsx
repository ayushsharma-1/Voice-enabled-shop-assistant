import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh,
  TrendingUp,
  AccessTime,
  Add
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useRecommendations } from '../../hooks/useRecommendations.js';
import { useWishlist } from '../../hooks/useWishlist.js';
import { COLORS, CATEGORIES } from '../../utils/constants.js';
import { formatDate, getCategoryInfo } from '../../utils/helpers.js';
import ProductCard from './ProductCard.jsx';
import LoadingSpinner from '../Common/LoadingSpinner.jsx';
import ErrorMessage from '../Common/ErrorMessage.jsx';

const RecommendationGrid = () => {
  const {
    recommendations,
    loading,
    error,
    lastUpdated,
    stats,
    refreshRecommendations,
    areRecommendationsStale
  } = useRecommendations();

  const { addItem } = useWishlist();

  const handleAddToWishlist = async (product, quantity = 1, category) => {
    try {
      await addItem(product, quantity, category);
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
    }
  };

  const handleRefresh = () => {
    refreshRecommendations();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <TrendingUp sx={{ color: COLORS.accent }} />
            <Typography variant="h6" fontWeight="bold">
              AI Recommendations
            </Typography>
            <Chip 
              label={`${stats.total} suggestions`}
              color="primary"
              size="small"
            />
            {areRecommendationsStale() && (
              <Chip 
                label="Stale"
                color="warning"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {lastUpdated && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <AccessTime sx={{ fontSize: 16, color: COLORS.gray }} />
                <Typography variant="caption" color="text.secondary">
                  Updated {formatDate(lastUpdated)}
                </Typography>
              </Box>
            )}
            <Tooltip title="Refresh recommendations">
              <IconButton
                onClick={handleRefresh}
                disabled={loading}
                sx={{
                  color: COLORS.primary,
                  '&:hover': {
                    backgroundColor: COLORS.primary + '10'
                  }
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Statistics */}
        {stats.total > 0 && (
          <Box mb={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2} bgcolor={COLORS.accent + '10'} borderRadius={1}>
                  <Typography variant="h6" color={COLORS.accent} fontWeight="bold">
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Recommendations
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2} bgcolor={COLORS.info + '10'} borderRadius={1}>
                  <Typography variant="h6" color={COLORS.info} fontWeight="bold">
                    {stats.categoryCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Categories
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2} bgcolor={COLORS.secondary + '10'} borderRadius={1}>
                  <Typography variant="h6" color={COLORS.secondary} fontWeight="bold">
                    ${stats.averagePrice.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Price
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2} bgcolor={COLORS.primary + '10'} borderRadius={1}>
                  <Typography variant="h6" color={COLORS.primary} fontWeight="bold">
                    ${stats.totalPrice.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Value
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Error Display */}
        {error && (
          <ErrorMessage 
            error={error} 
            onRetry={handleRefresh}
            sx={{ mb: 2 }}
          />
        )}

        {/* Loading State */}
        {loading && <LoadingSpinner message="Loading recommendations..." />}

        {/* Empty State */}
        {!loading && !error && recommendations.length === 0 && (
          <Box textAlign="center" py={4}>
            <TrendingUp sx={{ fontSize: 64, color: COLORS.gray, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" mb={1}>
              No recommendations available
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Add some items to your wishlist to get personalized recommendations
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={handleRefresh}
              sx={{
                borderColor: COLORS.primary,
                color: COLORS.primary,
                '&:hover': {
                  backgroundColor: COLORS.primary + '10'
                }
              }}
            >
              Refresh Recommendations
            </Button>
          </Box>
        )}

        {/* Recommendations Grid */}
        {!loading && !error && recommendations.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Grid container spacing={2}>
              {recommendations.map((product, index) => (
                <Grid item xs={12} sm={6} md={4} key={`${product.product}-${index}`}>
                  <motion.div variants={itemVariants}>
                    <ProductCard 
                      product={product} 
                      onAddToWishlist={handleAddToWishlist}
                    />
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecommendationGrid;
