import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import { COLORS } from '../../utils/constants.js';

const AudioVisualizer = ({ isRecording }) => {
  const [bars, setBars] = useState([]);

  useEffect(() => {
    if (!isRecording) {
      setBars([]);
      return;
    }

    // Generate random bars for visualization
    const generateBars = () => {
      const newBars = Array.from({ length: 20 }, () => ({
        height: Math.random() * 60 + 10,
        delay: Math.random() * 0.5
      }));
      setBars(newBars);
    };

    generateBars();
    const interval = setInterval(generateBars, 100);

    return () => clearInterval(interval);
  }, [isRecording]);

  if (!isRecording) return null;

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      gap={0.5}
      height={80}
      width="100%"
    >
      {bars.map((bar, index) => (
        <motion.div
          key={index}
          initial={{ height: 10 }}
          animate={{ 
            height: bar.height,
            transition: {
              duration: 0.1,
              delay: bar.delay,
              ease: "easeInOut"
            }
          }}
          style={{
            width: 3,
            backgroundColor: COLORS.primary,
            borderRadius: 2,
            minHeight: 10
          }}
        />
      ))}
    </Box>
  );
};

export default AudioVisualizer;
