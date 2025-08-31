import React, { useState, useEffect } from 'react';
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
  Alert
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  Store,
  Add,
  ShoppingCart
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { COLORS, CATEGORIES } from '../../utils/constants.js';
import { getCategoryInfo, formatCurrency } from '../../utils/helpers.js';
import { storeAPI } from '../../services/api.js';
import ProductCard from './ProductCard.jsx';
import LoadingSpinner from '../Common/LoadingSpinner.jsx';
import ErrorMessage from '../Common/ErrorMessage.jsx';

const StoreDisplay = ({ onAddToWishlist, refreshTrigger }) => {
  const [storeItems, setStoreItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load store items
  const loadStoreItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await storeAPI.getStoreItems();
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Transform the data to match our frontend format
      const transformedItems = response.store_items.map(item => ({
        product: item.product,
        category: item.category,
        price: item.price,
        stock: item.quantity // Backend uses 'quantity', frontend expects 'stock'
      }));
      
      setStoreItems(transformedItems);
    } catch (error) {
      setError(error.message);
      console.error('Error loading store items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load store items on mount
  useEffect(() => {
    loadStoreItems();
  }, []);

  // Refresh store items when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('Refreshing store items due to trigger:', refreshTrigger);
      loadStoreItems();
    }
  }, [refreshTrigger]);

  // Filter store items
  const filteredItems = storeItems.filter(item => {
    const matchesCategory = filter === 'all' || item.category === filter;
    const matchesSearch = !searchTerm || 
      item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleRefresh = () => {
    loadStoreItems();
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
            <Store sx={{ color: COLORS.secondary }} />
            <Typography variant="h6" fontWeight="bold">
              Store Products
            </Typography>
            <Chip 
              label={`${filteredItems.length} items`}
              color="primary"
              size="small"
            />
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
          </Box>
        </Box>

        {/* Search and Filter */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Search products..."
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
        {loading && <LoadingSpinner message="Loading store items..." />}

        {/* Store Items */}
        {!loading && !error && filteredItems.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Grid container spacing={2}>
              {filteredItems.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={`${item.product}-${index}`}>
                  <motion.div variants={itemVariants}>
                    <ProductCard 
                      product={item} 
                      onAddToWishlist={onAddToWishlist}
                      showAddButton={true}
                    />
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        )}

        {/* No Results */}
        {!loading && !error && filteredItems.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No products match your search criteria. Try adjusting your filters.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default StoreDisplay;
