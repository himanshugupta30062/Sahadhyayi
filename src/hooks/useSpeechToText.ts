
import * as React from 'react';
import { secureFetch } from '@/security/secureFetch';

interface UseSpeechToTextOptions {
  onTranscript: (text: string) => void;
  onError: (error: string) => void;
}

export const useSpeechToText = ({ onTranscript, onError }: UseSpeechToTextOptions) => {
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

            const response = await secureFetch('/api/stt', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error('STT request failed');
            }
            const data = await response.json();

            if (data?.transcription) {
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
