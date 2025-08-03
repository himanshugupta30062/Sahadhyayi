
import * as React from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseSpeechToTextOptions {
  onTranscript: (text: string) => void;
  onError: (error: string) => void;
}

export const useSpeechToText = ({ onTranscript, onError }: UseSpeechToTextOptions) => {
  console.log('useSpeechToText hook called...');
  console.log('React available in useSpeechToText:', !!React);
  console.log('React.useState available:', typeof React.useState);
  
  // Add safety check for React hooks
  if (!React || typeof React.useState !== 'function') {
    console.error('React hooks not available in useSpeechToText');
    return {
      isRecording: false,
      isProcessing: false,
      startRecording: async () => {},
      stopRecording: () => {},
      toggleRecording: () => {},
    };
  }

  const [isRecording, setIsRecording] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

  const startRecording = React.useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
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
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          // Use direct fetch for FormData to Supabase edge function
          const response = await fetch(`https://rknxtatvlzunatpyqxro.supabase.co/functions/v1/speech-to-text`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbnh0YXR2bHp1bmF0cHlxeHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzI0MjUsImV4cCI6MjA2NTUwODQyNX0.NXIWEwm8NlvzHnxf55cgdsy1ljX2IbFKQL7OS8xlb-U`,
            },
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          
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
    } catch (error) {
      console.error('Error starting recording:', error);
      onError('Could not access microphone. Please check permissions.');
    }
  }, [onTranscript, onError]);

  const stopRecording = React.useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  const toggleRecording = React.useCallback(() => {
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
