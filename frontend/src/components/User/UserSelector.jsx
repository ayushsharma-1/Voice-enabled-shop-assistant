import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  Person,
  Settings,
  Brightness4,
  Brightness7,
  Notifications,
  VolumeUp,
  Refresh
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useUser } from '../../contexts/UserContext.jsx';
import { COLORS } from '../../utils/constants.js';
import { getInitials } from '../../utils/helpers.js';

const UserSelector = () => {
  const { 
    currentUser, 
    setUser, 
    preferences, 
    updatePreferences 
  } = useUser();

  const [newUsername, setNewUsername] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const handleUserChange = () => {
    if (newUsername.trim()) {
      setUser(newUsername.trim());
      setNewUsername('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleUserChange();
    }
  };

  const handleThemeToggle = () => {
    const newTheme = preferences.theme === 'light' ? 'dark' : 'light';
    updatePreferences({ theme: newTheme });
  };

  const handlePreferenceChange = (key, value) => {
    updatePreferences({ [key]: value });
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Person sx={{ color: COLORS.primary }} />
            <Typography variant="h6" fontWeight="bold">
              User Profile
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title="Toggle theme">
              <IconButton
                onClick={handleThemeToggle}
                sx={{
                  color: preferences.theme === 'light' ? COLORS.gray : COLORS.accent,
                  '&:hover': {
                    backgroundColor: COLORS.grayLight + '20'
                  }
                }}
              >
                {preferences.theme === 'light' ? <Brightness4 /> : <Brightness7 />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton
                onClick={() => setShowSettings(!showSettings)}
                sx={{
                  color: showSettings ? COLORS.primary : COLORS.gray,
                  '&:hover': {
                    backgroundColor: COLORS.grayLight + '20'
                  }
                }}
              >
                <Settings />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Current User Display */}
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar
            sx={{
              bgcolor: COLORS.primary,
              width: 48,
              height: 48,
              fontSize: '1.2rem',
              fontWeight: 'bold'
            }}
          >
            {getInitials(currentUser || 'User')}
          </Avatar>
          <Box flex={1}>
            <Typography variant="h6" fontWeight="bold">
              {currentUser || 'User'}
            </Typography>
            <Chip 
              label="Active User" 
              size="small" 
              color="success"
              sx={{ fontSize: '0.7rem' }}
            />
          </Box>
        </Box>

        {/* User Switch */}
        <Box display="flex" gap={1} mb={2}>
          <TextField
            size="small"
            placeholder="Enter new username..."
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            sx={{ flex: 1 }}
          />
          <Button
            variant="outlined"
            onClick={handleUserChange}
            disabled={!newUsername.trim()}
            sx={{
              borderColor: COLORS.primary,
              color: COLORS.primary,
              '&:hover': {
                backgroundColor: COLORS.primary + '10'
              }
            }}
          >
            Switch User
          </Button>
        </Box>

        {/* Settings Panel */}
        <motion.div
          initial={false}
          animate={{ height: showSettings ? 'auto' : 0, opacity: showSettings ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ overflow: 'hidden' }}
        >
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" fontWeight="bold" mb={2}>
            Preferences
          </Typography>

          <Box display="flex" flexDirection="column" gap={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.voiceEnabled}
                  onChange={(e) => handlePreferenceChange('voiceEnabled', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <VolumeUp sx={{ fontSize: 16, color: COLORS.gray }} />
                  <Typography variant="body2">Voice Commands</Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.notifications}
                  onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Notifications sx={{ fontSize: 16, color: COLORS.gray }} />
                  <Typography variant="body2">Notifications</Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.autoRefresh}
                  onChange={(e) => handlePreferenceChange('autoRefresh', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Refresh sx={{ fontSize: 16, color: COLORS.gray }} />
                  <Typography variant="body2">Auto Refresh</Typography>
                </Box>
              }
            />
          </Box>

          <Box mt={2}>
            <Typography variant="caption" color="text.secondary">
              Current theme: {preferences.theme}
            </Typography>
          </Box>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default UserSelector;
