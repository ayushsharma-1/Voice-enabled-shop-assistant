import { useState, useCallback, useRef } from 'react';
import audioService from '../services/audioService.js';
import { voiceAPI } from '../services/api.js';
import { supportsVoiceRecording } from '../utils/helpers.js';

export const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  
  const recordingIntervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setResult(null);
      
      if (!supportsVoiceRecording()) {
        throw new Error('Voice recording is not supported in this browser');
      }

      await audioService.startRecording();
      setIsRecording(true);
      startTimeRef.current = Date.now();
      
      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingTime(elapsed);
      }, 1000);

    } catch (error) {
      setError(error.message);
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      if (!isRecording) return;

      // Stop the timer
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      setIsRecording(false);
      setIsProcessing(true);

      // Stop recording and get audio file
      const audioFile = await audioService.stopRecording();
      
      if (!audioFile || audioFile.size === 0) {
        throw new Error('No audio recorded. Please try again.');
      }

      // Process the voice command
      const response = await voiceAPI.processVoice(audioFile);
      
      if (response.error) {
        throw new Error(response.error);
      }

      setResult(response);
      setRecordingTime(0);

    } catch (error) {
      setError(error.message);
      setResult(null);
    } finally {
      setIsProcessing(false);
    }
  }, [isRecording]);

  const resetRecording = useCallback(() => {
    setError(null);
    setResult(null);
    setRecordingTime(0);
    setIsRecording(false);
    setIsProcessing(false);
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  }, []);

  const formatRecordingTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    if (isRecording) {
      audioService.stopRecording().catch(console.error);
    }
  }, [isRecording]);

  return {
    isRecording,
    isProcessing,
    recordingTime,
    error,
    result,
    startRecording,
    stopRecording,
    resetRecording,
    formatRecordingTime,
    cleanup,
    supportsVoiceRecording: supportsVoiceRecording()
  };
};
