
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Headphones, Loader2, Play, Pause } from 'lucide-react';
import { useCreateAudioSummary, useAudioSummary } from '@/hooks/useAudioSummaries';

interface AudioSummaryButtonProps {
  bookId: string;
  bookContent?: string;
}

const AudioSummaryButton = ({ bookId, bookContent }: AudioSummaryButtonProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  
  const { data: existingSummary } = useAudioSummary(bookId);
  const createAudioSummary = useCreateAudioSummary();

  const handleAudioSummary = async () => {
    try {
      let audioUrl = existingSummary?.audio_url;
      
      if (!audioUrl) {
        if (!bookContent) {
          alert('Book content not available for audio summary');
          return;
        }
        
        const result = await createAudioSummary.mutateAsync({
          bookId,
          content: bookContent
        });
        audioUrl = result.audio_url;
      }
      
      if (audio) {
        audio.pause();
        setAudio(null);
        setIsPlaying(false);
      }
      
      const newAudio = new Audio(audioUrl);
      newAudio.onended = () => {
        setIsPlaying(false);
        setAudio(null);
      };
      
      await newAudio.play();
      setAudio(newAudio);
      setIsPlaying(true);
      
    } catch (error) {
      console.error('Error with audio summary:', error);
      alert('Failed to generate or play audio summary');
    }
  };

  const togglePlayPause = () => {
    if (audio) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="flex gap-2 w-full">
      <Button
        onClick={handleAudioSummary}
        disabled={createAudioSummary.isPending}
        className="bg-orange-600 hover:bg-orange-700 text-white flex-1 h-12 text-base"
      >
        {createAudioSummary.isPending ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Generating Audio...
          </>
        ) : (
          <>
            <Headphones className="w-5 h-5 mr-2" />
            15 Min Audio Summary
          </>
        )}
      </Button>
      
      {audio && (
        <Button
          onClick={togglePlayPause}
          variant="outline"
          className="h-12 w-12 flex-shrink-0"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </Button>
      )}
    </div>
  );
};

export default AudioSummaryButton;
