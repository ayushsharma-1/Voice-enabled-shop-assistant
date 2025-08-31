import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { COLORS } from '../../utils/constants.js';

const LoadingSpinner = ({ 
  size = 'medium', 
  message = 'Loading...', 
  fullScreen = false,
  color = 'primary' 
}) => {
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60
  };

  const spinnerSize = sizeMap[size] || sizeMap.medium;

  const content = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
    >
      <CircularProgress 
        size={spinnerSize} 
        sx={{ 
          color: color === 'primary' ? COLORS.primary : color,
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          }
        }} 
      />
      {message && (
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            textAlign: 'center',
            maxWidth: 200,
            lineHeight: 1.4
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgcolor="rgba(255, 255, 255, 0.9)"
        zIndex={9999}
      >
        {content}
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight={200}
      width="100%"
    >
      {content}
    </Box>
  );
};

export default LoadingSpinner;
