import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Avatar,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Add,
  ShoppingCart,
  Star,
  LocalOffer
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { COLORS, CATEGORIES } from '../../utils/constants.js';
import { getCategoryInfo, formatCurrency } from '../../utils/helpers.js';

const ProductCard = ({ product, onAddToWishlist, showAddButton = false }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const categoryInfo = getCategoryInfo(product.category);

  const handleAddToWishlist = async () => {
    if (!onAddToWishlist) return;

    try {
      setIsAdding(true);
      await onAddToWishlist(product.product, 1, product.category);
      setIsAdded(true);
      
      // Reset added state after 2 seconds
      setTimeout(() => {
        setIsAdded(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'visible',
          '&:hover': {
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
          }
        }}
      >
        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          {/* Product Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar
                sx={{
                  bgcolor: categoryInfo?.color || COLORS.gray,
                  width: 32,
                  height: 32,
                  fontSize: '0.875rem'
                }}
              >
                {categoryInfo?.icon || '📦'}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold" noWrap>
                  {product.product}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {categoryInfo?.name || product.category}
                </Typography>
              </Box>
            </Box>
            
            {showAddButton && (
              <Tooltip title={isAdded ? "Added to wishlist!" : "Add to wishlist"}>
                <IconButton
                  onClick={handleAddToWishlist}
                  disabled={isAdding}
                  sx={{
                    color: isAdded ? COLORS.success : COLORS.primary,
                    '&:hover': {
                      backgroundColor: (isAdded ? COLORS.success : COLORS.primary) + '10'
                    }
                  }}
                >
                  {isAdded ? <ShoppingCart /> : <Add />}
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Product Details */}
          <Box mb={2}>
            <Typography variant="h5" fontWeight="bold" color={COLORS.primary}>
              {formatCurrency(product.price)}
            </Typography>
            
            <Box display="flex" alignItems="center" gap={1} mt={1}>
              <Chip
                label={`Stock: ${product.stock}`}
                size="small"
                color={product.stock > 10 ? "success" : product.stock > 0 ? "warning" : "error"}
                variant="outlined"
              />
            </Box>
          </Box>

          {/* Add to Wishlist Button */}
          {showAddButton && (
            <Box mt="auto">
              <Button
                fullWidth
                variant={isAdded ? "outlined" : "contained"}
                startIcon={isAdded ? <ShoppingCart /> : <Add />}
                onClick={handleAddToWishlist}
                disabled={isAdding}
                sx={{
                  backgroundColor: isAdded ? 'transparent' : COLORS.primary,
                  color: isAdded ? COLORS.success : 'white',
                  borderColor: isAdded ? COLORS.success : 'transparent',
                  '&:hover': {
                    backgroundColor: isAdded ? COLORS.success + '10' : COLORS.primaryDark,
                  }
                }}
              >
                {isAdding ? 'Adding...' : isAdded ? 'Added!' : 'Add to Wishlist'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProductCard;
