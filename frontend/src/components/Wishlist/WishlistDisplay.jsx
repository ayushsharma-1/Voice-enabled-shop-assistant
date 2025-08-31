import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  Button,
  Grid,
  Divider,
  Alert
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  ShoppingCart,
  Add,
  Delete
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useWishlist } from '../../hooks/useWishlist.js';
import { COLORS, CATEGORIES } from '../../utils/constants.js';
import { formatDate, getCategoryInfo } from '../../utils/helpers.js';
import WishlistItem from './WishlistItem.jsx';
import LoadingSpinner from '../Common/LoadingSpinner.jsx';
import ErrorMessage from '../Common/ErrorMessage.jsx';
import ConfirmDialog from '../Common/ConfirmDialog.jsx';

const WishlistDisplay = () => {
  const {
    wishlist,
    filteredWishlist,
    loading,
    error,
    filter,
    searchTerm,
    stats,
    setFilter,
    setSearchTerm,
    clearWishlist,
    loadWishlist
  } = useWishlist();

  const [showClearDialog, setShowClearDialog] = useState(false);

  const handleClearWishlist = async () => {
    try {
      await clearWishlist();
      setShowClearDialog(false);
    } catch (error) {
      console.error('Failed to clear wishlist:', error);
    }
  };

  const handleRefresh = () => {
    loadWishlist(true);
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
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <ShoppingCart sx={{ color: COLORS.secondary }} />
              <Typography variant="h6" fontWeight="bold">
                My Wishlist
              </Typography>
              <Chip 
                label={`${stats.total} items`}
                color="primary"
                size="small"
              />
              {loading && (
                <Chip 
                  label="Updating..."
                  color="warning"
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
            <Box display="flex" gap={1}>
              <Button
                size="small"
                startIcon={<Add />}
                onClick={handleRefresh}
                disabled={loading}
                sx={{
                  color: COLORS.primary,
                  '&:hover': {
                    backgroundColor: COLORS.primary + '10'
                  }
                }}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
              {wishlist.length > 0 && (
                <Button
                  size="small"
                  startIcon={<Delete />}
                  onClick={() => setShowClearDialog(true)}
                  disabled={loading}
                  sx={{
                    color: COLORS.error,
                    '&:hover': {
                      backgroundColor: COLORS.error + '10'
                    }
                  }}
                >
                  Clear All
                </Button>
              )}
            </Box>
          </Box>

          {/* Statistics */}
          {stats.total > 0 && (
            <Box mb={3}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2} bgcolor={COLORS.primary + '10'} borderRadius={1}>
                    <Typography variant="h6" color={COLORS.primary} fontWeight="bold">
                      {stats.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Items
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2} bgcolor={COLORS.secondary + '10'} borderRadius={1}>
                    <Typography variant="h6" color={COLORS.secondary} fontWeight="bold">
                      {stats.totalQuantity}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Quantity
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2} bgcolor={COLORS.accent + '10'} borderRadius={1}>
                    <Typography variant="h6" color={COLORS.accent} fontWeight="bold">
                      {stats.categoryCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Categories
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2} bgcolor={COLORS.info + '10'} borderRadius={1}>
                    <Typography variant="h6" color={COLORS.info} fontWeight="bold">
                      {Object.keys(stats.categories).length > 0 ? 
                        Object.values(stats.categories).reduce((a, b) => a + b, 0) : 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Unique Items
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Search and Filter */}
          <Box display="flex" gap={2} mb={3} flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search wishlist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ color: COLORS.gray, mr: 1 }} />,
                endAdornment: searchTerm && (
                  <IconButton
                    size="small"
                    onClick={() => setSearchTerm('')}
                    sx={{ color: COLORS.gray }}
                  >
                    <Clear />
                  </IconButton>
                )
              }}
              sx={{ minWidth: 250, flex: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                label="Category"
                startAdornment={<FilterList sx={{ color: COLORS.gray, mr: 1 }} />}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {Object.entries(CATEGORIES).map(([key, category]) => (
                  <MenuItem key={key} value={key}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Error Display */}
          {error && (
            <ErrorMessage 
              error={error} 
              onRetry={handleRefresh}
              sx={{ mb: 2 }}
            />
          )}

          {/* Loading State */}
          {loading && <LoadingSpinner message="Loading wishlist..." />}

          {/* Empty State */}
          {!loading && !error && wishlist.length === 0 && (
            <Box textAlign="center" py={4}>
              <ShoppingCart sx={{ fontSize: 64, color: COLORS.gray, mb: 2 }} />
              <Typography variant="h6" color="text.secondary" mb={1}>
                Your wishlist is empty
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Use voice commands or manually add items to get started
              </Typography>
            </Box>
          )}

          {/* No Results */}
          {!loading && !error && wishlist.length > 0 && filteredWishlist.length === 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              No items match your search criteria. Try adjusting your filters.
            </Alert>
          )}

          {/* Wishlist Items */}
          {!loading && !error && filteredWishlist.length > 0 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Grid container spacing={2}>
                {filteredWishlist.map((item, index) => (
                  <Grid item xs={12} sm={6} md={4} key={`${item.product}-${index}`}>
                    <motion.div variants={itemVariants}>
                      <WishlistItem item={item} />
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Clear Wishlist Confirmation */}
      <ConfirmDialog
        open={showClearDialog}
        onClose={() => setShowClearDialog(false)}
        onConfirm={handleClearWishlist}
        title="Clear Wishlist"
        message="Are you sure you want to remove all items from your wishlist? This action cannot be undone."
        confirmText="Clear All"
        cancelText="Cancel"
        severity="warning"
        loading={loading}
      />
    </>
  );
};

export default WishlistDisplay;
