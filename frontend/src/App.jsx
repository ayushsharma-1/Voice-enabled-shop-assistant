import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  ShoppingCart,
  VolumeUp,
  GitHub,
  Info
} from '@mui/icons-material';
import { UserProvider, useUser } from './contexts/UserContext.jsx';
import { COLORS } from './utils/constants.js';
import VoiceRecorder from './components/VoiceRecorder/VoiceRecorder.jsx';
import WishlistDisplay from './components/Wishlist/WishlistDisplay.jsx';
import RecommendationGrid from './components/Recommendations/RecommendationGrid.jsx';
import StoreDisplay from './components/Store/StoreDisplay.jsx';
import UserSelector from './components/User/UserSelector.jsx';
import { useWishlist } from './hooks/useWishlist.js';

// Create theme based on user preferences
const createAppTheme = (themeMode) => {
  return createTheme({
    palette: {
      mode: themeMode,
      primary: {
        main: COLORS.primary,
        light: COLORS.primaryLight,
        dark: COLORS.primaryDark,
      },
      secondary: {
        main: COLORS.secondary,
        light: COLORS.secondaryLight,
        dark: COLORS.secondaryDark,
      },
      error: {
        main: COLORS.error,
      },
      warning: {
        main: COLORS.warning,
      },
      info: {
        main: COLORS.info,
      },
      success: {
        main: COLORS.success,
      },
      background: {
        default: themeMode === 'light' ? COLORS.background : '#121212',
        paper: themeMode === 'light' ? COLORS.surface : '#1e1e1e',
      },
      text: {
        primary: themeMode === 'light' ? COLORS.text : '#ffffff',
        secondary: themeMode === 'light' ? COLORS.textSecondary : '#b0b0b0',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
      },
      h2: {
        fontWeight: 600,
      },
      h3: {
        fontWeight: 600,
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: themeMode === 'light' 
              ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
              : '0 2px 8px rgba(0, 0, 0, 0.3)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
    },
  });
};

const MainApp = () => {
  const { wishlist, loading, error, updateWishlist, addItem, clearError } = useWishlist();
  const [wishlistError, setWishlistError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [themeMode] = useState('light');
  const [storeRefreshTrigger, setStoreRefreshTrigger] = useState(0); // Add store refresh trigger

  const theme = createAppTheme(themeMode);

  // Handle voice command result
  const handleVoiceCommand = async (llmResponse) => {
    try {
      const result = await updateWishlist(llmResponse);
      setSuccessMessage(`Voice command processed: ${llmResponse.action} ${llmResponse.product}`);
      // Trigger store refresh after successful wishlist update
      setStoreRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Voice command failed:', error);
      setWishlistError('Voice command failed: ' + error.message);
    }
  };

  const handleCloseSnackbar = () => {
    clearError();
    setWishlistError(null);
  };

  const handleCloseSuccessSnackbar = () => {
    setSuccessMessage('');
  };

  const handleAddToWishlist = async (product, quantity = 1, category = 'unknown') => {
    try {
      await addItem(product, quantity, category);
      setSuccessMessage(`${product} added to wishlist!`);
      // Trigger store refresh after successful manual addition
      setStoreRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
      setWishlistError('Failed to add to wishlist: ' + error.message);
    }
  };

  const currentError = error || wishlistError;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* App Bar */}
        <AppBar 
          position="static" 
          elevation={0}
          sx={{ 
            bgcolor: 'background.paper',
            borderBottom: `1px solid ${COLORS.grayLight}20`
          }}
        >
          <Toolbar>
            <Box display="flex" alignItems="center" gap={1} flex={1}>
              <VolumeUp sx={{ color: COLORS.primary }} />
              <Typography variant="h6" fontWeight="bold" color="text.primary">
                Voice Shopping Assistant
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Tooltip title="GitHub Repository">
                <IconButton
                  onClick={() => window.open('https://github.com', '_blank')}
                  sx={{ color: COLORS.gray }}
                >
                  <GitHub />
                </IconButton>
              </Tooltip>
              <Tooltip title="About">
                <IconButton
                  sx={{ color: COLORS.gray }}
                >
                  <Info />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box display="flex" flexDirection="column" gap={3}>
            {/* User Selector */}
            <UserSelector />

            {/* Voice Recorder */}
            <VoiceRecorder onCommandProcessed={handleVoiceCommand} />

            {/* Store Display */}
            <StoreDisplay 
              onAddToWishlist={handleAddToWishlist} 
              refreshTrigger={storeRefreshTrigger}
            />

            {/* Wishlist */}
            <WishlistDisplay />

            {/* Recommendations */}
            <RecommendationGrid />
          </Box>
        </Container>

        {/* Error Snackbar */}
        <Snackbar
          open={!!currentError}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity="error"
            variant="filled"
            sx={{ width: '100%' }}
          >
            {currentError}
          </Alert>
        </Snackbar>

        {/* Success Snackbar */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={3000}
          onClose={handleCloseSuccessSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSuccessSnackbar}
            severity="success"
            variant="filled"
            sx={{ width: '100%' }}
          >
            {successMessage}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

const App = () => {
  return (
    <UserProvider>
      <MainApp />
    </UserProvider>
  );
};

export default App;
