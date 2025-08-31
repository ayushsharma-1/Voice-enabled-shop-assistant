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

const ProductCard = ({ product, onAddToWishlist }) => {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const categoryInfo = getCategoryInfo(product.category);

  const handleAddToWishlist = async () => {
    try {
      setLoading(true);
      await onAddToWishlist(product.product, product.quantity || 1, product.category);
      setAdded(true);
      
      // Reset added state after 2 seconds
      setTimeout(() => setAdded(false), 2000);
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityColor = () => {
    const quantity = product.quantity || 0;
    if (quantity === 0) return COLORS.error;
    if (quantity < 10) return COLORS.warning;
    return COLORS.success;
  };

  const getAvailabilityText = () => {
    const quantity = product.quantity || 0;
    if (quantity === 0) return 'Out of Stock';
    if (quantity < 10) return 'Low Stock';
    return 'In Stock';
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${COLORS.grayLight}`,
          '&:hover': {
            borderColor: COLORS.accent,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          },
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'visible'
        }}
      >
        {/* AI Recommendation Badge */}
        <Box
          position="absolute"
          top={-8}
          right={16}
          zIndex={1}
        >
          <Chip
            icon={<Star sx={{ fontSize: 16 }} />}
            label="AI Recommended"
            size="small"
            sx={{
              backgroundColor: COLORS.accent,
              color: COLORS.white,
              fontWeight: 'bold',
              fontSize: '0.7rem',
              '& .MuiChip-icon': {
                color: COLORS.white
              }
            }}
          />
        </Box>

        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar
                sx={{
                  bgcolor: categoryInfo.color,
                  color: COLORS.dark,
                  fontSize: '1.2rem'
                }}
              >
                {categoryInfo.icon}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" fontSize="0.75rem">
                  {categoryInfo.name}
                </Typography>
                <Chip
                  label={getAvailabilityText()}
                  size="small"
                  sx={{
                    backgroundColor: getAvailabilityColor() + '20',
                    color: getAvailabilityColor(),
                    fontSize: '0.7rem',
                    height: 20
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Product Info */}
          <Box flex={1}>
            <Typography
              variant="h6"
              fontWeight="bold"
              color="text.primary"
              mb={1}
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.3
              }}
            >
              {product.product}
            </Typography>

            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <LocalOffer sx={{ fontSize: 16, color: COLORS.gray }} />
              <Typography variant="body2" color="text.secondary">
                Price: <strong>{formatCurrency(product.price)}</strong>
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <ShoppingCart sx={{ fontSize: 16, color: COLORS.gray }} />
              <Typography variant="body2" color="text.secondary">
                Available: <strong>{product.quantity || 0}</strong>
              </Typography>
            </Box>
          </Box>

          {/* Actions */}
          <Box display="flex" gap={1} mt="auto">
            <Button
              variant="contained"
              size="small"
              fullWidth
              startIcon={added ? <ShoppingCart /> : <Add />}
              onClick={handleAddToWishlist}
              disabled={loading || (product.quantity || 0) === 0}
              sx={{
                backgroundColor: added ? COLORS.success : COLORS.accent,
                '&:hover': {
                  backgroundColor: added ? COLORS.successDark : COLORS.accentDark
                },
                '&:disabled': {
                  backgroundColor: COLORS.grayLight
                }
              }}
            >
              {loading ? 'Adding...' : added ? 'Added!' : 'Add to Wishlist'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProductCard;
