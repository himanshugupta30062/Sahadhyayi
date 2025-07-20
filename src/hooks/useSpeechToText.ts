
import { useState, useRef, useCallback } from 'react';

interface UseSpeechToTextOptions {
  onTranscript: (text: string) => void;
  onError: (error: string) => void;
}

export const useSpeechToText = ({ onTranscript, onError }: UseSpeechToTextOptions) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsProcessing(true);

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          console.log('Sending audio to speech-to-text function...');

          // Use direct fetch to Supabase edge function
          const response = await fetch(`https://rknxtatvlzunatpyqxro.supabase.co/functions/v1/speech-to-text`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbnh0YXR2bHp1bmF0cHlxeHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzI0MjUsImV4cCI6MjA2NTUwODQyNX0.NXIWEwm8NlvzHnxf55cgdsy1ljX2IbFKQL7OS8xlb-U`,
            },
            body: formData,
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Speech-to-text API error:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log('Speech-to-text result:', data);
          
          if (data.error) {
            throw new Error(data.error);
          }

          if (data.transcription) {
            onTranscript(data.transcription);
          } else {
            onError('No transcription received');
          }
        } catch (error) {
          console.error('Transcription error:', error);
          onError('Failed to transcribe audio. Please try again.');
        } finally {
          setIsProcessing(false);
        }

        // Clean up media stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log('Recording started...');
    } catch (error) {
      console.error('Error starting recording:', error);
      onError('Could not access microphone. Please check permissions.');
    }
  }, [onTranscript, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('Stopping recording...');
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    toggleRecording,
  };
};
