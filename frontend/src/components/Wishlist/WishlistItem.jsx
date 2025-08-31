import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Button,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  Delete,
  Edit,
  ShoppingCart,
  AccessTime
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useWishlist } from '../../hooks/useWishlist.js';
import { COLORS, CATEGORIES } from '../../utils/constants.js';
import { formatDate, getCategoryInfo, formatCurrency } from '../../utils/helpers.js';
import ConfirmDialog from '../Common/ConfirmDialog.jsx';

const WishlistItem = ({ item }) => {
  const { removeItem } = useWishlist();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const categoryInfo = getCategoryInfo(item.category);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await removeItem(item.product);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (item.status) {
      case 'ai_generated':
        return COLORS.primary;
      case 'manual':
        return COLORS.secondary;
      default:
        return COLORS.gray;
    }
  };

  const getStatusText = () => {
    switch (item.status) {
      case 'ai_generated':
        return 'Voice Added';
      case 'manual':
        return 'Manual';
      default:
        return 'Unknown';
    }
  };

  return (
    <>
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
              borderColor: COLORS.primary,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            },
            transition: 'all 0.3s ease'
          }}
        >
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
                    label={getStatusText()}
                    size="small"
                    sx={{
                      backgroundColor: getStatusColor() + '20',
                      color: getStatusColor(),
                      fontSize: '0.7rem',
                      height: 20
                    }}
                  />
                </Box>
              </Box>
              <Tooltip title="Remove from wishlist">
                <IconButton
                  size="small"
                  onClick={() => setShowDeleteDialog(true)}
                  sx={{
                    color: COLORS.error,
                    '&:hover': {
                      backgroundColor: COLORS.error + '10'
                    }
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
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
                {item.product}
              </Typography>

              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <ShoppingCart sx={{ fontSize: 16, color: COLORS.gray }} />
                <Typography variant="body2" color="text.secondary">
                  Quantity: <strong>{item.quantity}</strong>
                </Typography>
              </Box>

              {item.timestamp && (
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <AccessTime sx={{ fontSize: 16, color: COLORS.gray }} />
                  <Typography variant="caption" color="text.secondary">
                    Added {formatDate(item.timestamp)}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Actions */}
            <Box display="flex" gap={1} mt="auto">
              <Button
                variant="outlined"
                size="small"
                fullWidth
                sx={{
                  borderColor: COLORS.primary,
                  color: COLORS.primary,
                  '&:hover': {
                    backgroundColor: COLORS.primary + '10',
                    borderColor: COLORS.primaryDark
                  }
                }}
              >
                View Details
              </Button>
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Remove Item"
        message={`Are you sure you want to remove "${item.product}" from your wishlist?`}
        confirmText="Remove"
        cancelText="Cancel"
        severity="warning"
        loading={loading}
      />
    </>
  );
};

export default WishlistItem;
