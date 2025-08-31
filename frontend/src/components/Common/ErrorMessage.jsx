import React from 'react';
import { 
  Alert, 
  AlertTitle, 
  Box, 
  Button, 
  Typography 
} from '@mui/material';
import { Refresh, Error as ErrorIcon } from '@mui/icons-material';
import { COLORS } from '../../utils/constants.js';

const ErrorMessage = ({ 
  error, 
  title = 'Error', 
  onRetry, 
  onDismiss,
  variant = 'filled',
  severity = 'error',
  showIcon = true,
  fullWidth = true,
  sx = {}
}) => {
  if (!error) return null;

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  const alertContent = (
    <Alert
      severity={severity}
      variant={variant}
      onClose={onDismiss ? handleDismiss : undefined}
      icon={showIcon ? undefined : false}
      sx={{
        width: fullWidth ? '100%' : 'auto',
        '& .MuiAlert-message': {
          width: '100%'
        },
        ...sx
      }}
    >
      {title && <AlertTitle>{title}</AlertTitle>}
      <Box>
        <Typography variant="body2" component="div">
          {error}
        </Typography>
        {onRetry && (
          <Box mt={1}>
            <Button
              size="small"
              startIcon={<Refresh />}
              onClick={handleRetry}
              sx={{
                color: severity === 'error' ? COLORS.error : COLORS.primary,
                '&:hover': {
                  backgroundColor: severity === 'error' 
                    ? 'rgba(231, 76, 60, 0.1)' 
                    : 'rgba(52, 152, 219, 0.1)'
                }
              }}
            >
              Try Again
            </Button>
          </Box>
        )}
      </Box>
    </Alert>
  );

  // Simple error display without Alert component
  if (variant === 'simple') {
    return (
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        p={2}
        borderRadius={1}
        bgcolor={COLORS.error + '10'}
        border={`1px solid ${COLORS.error + '30'}`}
        sx={sx}
      >
        {showIcon && (
          <ErrorIcon 
            sx={{ 
              color: COLORS.error,
              fontSize: 20
            }} 
          />
        )}
        <Box flex={1}>
          {title && (
            <Typography 
              variant="subtitle2" 
              color={COLORS.error}
              fontWeight="bold"
            >
              {title}
            </Typography>
          )}
          <Typography 
            variant="body2" 
            color={COLORS.error}
          >
            {error}
          </Typography>
        </Box>
        {onRetry && (
          <Button
            size="small"
            startIcon={<Refresh />}
            onClick={handleRetry}
            sx={{
              color: COLORS.error,
              '&:hover': {
                backgroundColor: 'rgba(231, 76, 60, 0.1)'
              }
            }}
          >
            Retry
          </Button>
        )}
      </Box>
    );
  }

  return alertContent;
};

export default ErrorMessage;
