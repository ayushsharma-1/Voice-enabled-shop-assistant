import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import { Close, Warning, Info, CheckCircle, Error } from '@mui/icons-material';
import { COLORS } from '../../utils/constants.js';

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  severity = 'info',
  showIcon = true,
  maxWidth = 'sm',
  fullWidth = true,
  disableBackdropClick = false,
  loading = false
}) => {
  const handleConfirm = () => {
    if (onConfirm && !loading) {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!loading && onClose) {
      onClose();
    }
  };

  const getIcon = () => {
    switch (severity) {
      case 'warning':
        return <Warning sx={{ color: COLORS.warning, fontSize: 32 }} />;
      case 'error':
        return <Error sx={{ color: COLORS.error, fontSize: 32 }} />;
      case 'success':
        return <CheckCircle sx={{ color: COLORS.success, fontSize: 32 }} />;
      default:
        return <Info sx={{ color: COLORS.info, fontSize: 32 }} />;
    }
  };

  const getConfirmButtonColor = () => {
    switch (severity) {
      case 'warning':
        return COLORS.warning;
      case 'error':
        return COLORS.error;
      case 'success':
        return COLORS.success;
      default:
        return COLORS.primary;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={disableBackdropClick ? undefined : handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          {showIcon && getIcon()}
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        {!loading && (
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              color: COLORS.gray,
              '&:hover': {
                backgroundColor: COLORS.grayLight + '20'
              }
            }}
          >
            <Close />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{
            color: COLORS.gray,
            '&:hover': {
              backgroundColor: COLORS.grayLight + '20'
            }
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading}
          variant="contained"
          sx={{
            backgroundColor: getConfirmButtonColor(),
            '&:hover': {
              backgroundColor: getConfirmButtonColor() + 'dd'
            },
            '&:disabled': {
              backgroundColor: COLORS.grayLight
            }
          }}
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
