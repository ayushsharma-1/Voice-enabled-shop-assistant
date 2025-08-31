class AudioService {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Failed to start recording. Please check microphone permissions.');
    }
  }

  stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        
        // Stop all tracks
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        // Create audio file
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'voice-command.webm', { type: 'audio/webm' });
        
        resolve(audioFile);
      };

      this.mediaRecorder.stop();
    });
  }

  isCurrentlyRecording() {
    return this.isRecording;
  }

  getRecordingState() {
    return {
      isRecording: this.isRecording,
      hasMediaRecorder: !!this.mediaRecorder
    };
  }
}

export default new AudioService();
