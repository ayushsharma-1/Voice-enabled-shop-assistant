import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Mic,
  MicOff,
  Stop,
  Refresh,
  VolumeUp,
  Info
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceRecording } from '../../hooks/useVoiceRecording.js';
import { COLORS, VOICE_EXAMPLES } from '../../utils/constants.js';
import AudioVisualizer from './AudioVisualizer.jsx';
import LoadingSpinner from '../Common/LoadingSpinner.jsx';
import ConfirmDialog from '../Common/ConfirmDialog.jsx';

const VoiceRecorder = ({ onCommandProcessed }) => {
  const {
    isRecording,
    isProcessing,
    recordingTime,
    error,
    result,
    startRecording,
    stopRecording,
    resetRecording,
    formatRecordingTime,
    supportsVoiceRecording
  } = useVoiceRecording();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentExample, setCurrentExample] = useState(0);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);

  // Rotate through voice examples
  useEffect(() => {
    if (!isRecording && !isProcessing) {
      const interval = setInterval(() => {
        setCurrentExample((prev) => (prev + 1) % VOICE_EXAMPLES.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isRecording, isProcessing]);

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = async () => {
    try {
      await stopRecording();
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const handleConfirmCommand = async () => {
    if (result?.llm_response && onCommandProcessed) {
      try {
        setIsProcessingCommand(true);
        await onCommandProcessed(result.llm_response);
        resetRecording();
      } catch (error) {
        console.error('Failed to process command:', error);
      } finally {
        setIsProcessingCommand(false);
      }
    }
    setShowConfirmDialog(false);
  };

  const handleCancelCommand = () => {
    setShowConfirmDialog(false);
    resetRecording();
  };

  // Show confirmation dialog when voice is processed
  useEffect(() => {
    if (result?.llm_response && !showConfirmDialog) {
      setShowConfirmDialog(true);
    }
  }, [result, showConfirmDialog]);

  if (!supportsVoiceRecording) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Alert severity="warning" icon={<Info />}>
            <Typography variant="body2">
              Voice recording is not supported in your browser. 
              Please use Chrome, Firefox, or Safari for voice commands.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card 
        sx={{ 
          mb: 3,
          background: isRecording 
            ? `linear-gradient(135deg, ${COLORS.primary}15, ${COLORS.primaryLight}15)`
            : 'background.paper',
          border: isRecording ? `2px solid ${COLORS.primary}` : '1px solid',
          borderColor: isRecording ? COLORS.primary : 'divider',
          transition: 'all 0.3s ease'
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <VolumeUp sx={{ color: COLORS.primary }} />
              <Typography variant="h6" fontWeight="bold">
                Voice Commands
              </Typography>
            </Box>
            <Chip 
              label={isRecording ? 'Recording' : isProcessing ? 'Processing' : 'Ready'}
              color={isRecording ? 'error' : isProcessing ? 'warning' : 'default'}
              size="small"
            />
          </Box>

          {/* Recording Timer */}
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Typography 
                variant="h4" 
                textAlign="center" 
                color={COLORS.primary}
                fontWeight="bold"
                mb={2}
              >
                {formatRecordingTime(recordingTime)}
              </Typography>
            </motion.div>
          )}

          {/* Audio Visualizer */}
          {isRecording && (
            <Box mb={2}>
              <AudioVisualizer isRecording={isRecording} />
            </Box>
          )}

          {/* Voice Examples */}
          {!isRecording && !isProcessing && (
            <motion.div
              key={currentExample}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Typography 
                variant="body2" 
                color="text.secondary" 
                textAlign="center"
                fontStyle="italic"
                mb={2}
              >
                Try saying: "{VOICE_EXAMPLES[currentExample]}"
              </Typography>
            </motion.div>
          )}

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Recording Controls */}
          <Box display="flex" justifyContent="center" gap={2}>
            {!isRecording && !isProcessing ? (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Mic />}
                  onClick={handleStartRecording}
                  sx={{
                    backgroundColor: COLORS.primary,
                    borderRadius: '50px',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 20px rgba(52, 152, 219, 0.3)',
                    '&:hover': {
                      backgroundColor: COLORS.primaryDark,
                      boxShadow: '0 6px 25px rgba(52, 152, 219, 0.4)'
                    }
                  }}
                >
                  Start Recording
                </Button>
              </motion.div>
            ) : isRecording ? (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Stop />}
                  onClick={handleStopRecording}
                  sx={{
                    backgroundColor: COLORS.error,
                    borderRadius: '50px',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 20px rgba(231, 76, 60, 0.3)',
                    '&:hover': {
                      backgroundColor: '#c0392b',
                      boxShadow: '0 6px 25px rgba(231, 76, 60, 0.4)'
                    }
                  }}
                >
                  Stop Recording
                </Button>
              </motion.div>
            ) : (
              <LoadingSpinner size="small" message="Processing voice..." />
            )}
          </Box>

          {/* Reset Button */}
          {result && !isRecording && !isProcessing && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Tooltip title="Record new command">
                <IconButton
                  onClick={resetRecording}
                  sx={{
                    color: COLORS.gray,
                    '&:hover': {
                      backgroundColor: COLORS.grayLight + '20'
                    }
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Command Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirmDialog}
        onClose={handleCancelCommand}
        onConfirm={handleConfirmCommand}
        title="Confirm Voice Command"
        message={
          result ? (
            <Box>
              <Typography variant="body1" mb={1}>
                <strong>You said:</strong> "{result.recognized_text}"
              </Typography>
              <Typography variant="body1">
                <strong>Action:</strong> {result.llm_response.action} {result.llm_response.quantity} × {result.llm_response.product}
              </Typography>
            </Box>
          ) : ''
        }
        confirmText="Confirm"
        cancelText="Cancel"
        severity="info"
        loading={isProcessingCommand}
      />
    </>
  );
};

export default VoiceRecorder;
