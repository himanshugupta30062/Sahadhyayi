
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, SkipBack, SkipForward, Volume2, Headphones } from 'lucide-react';
import { useAudioSummary, useCreateAudioSummary } from '@/hooks/useAudioSummaries';
import { toast } from '@/hooks/use-toast';

interface AudioSummaryPlayerProps {
  bookId: string;
  bookTitle: string;
  bookContent?: string;
}

const AudioSummaryPlayer: React.FC<AudioSummaryPlayerProps> = ({
  bookId,
  bookTitle,
  bookContent
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const { data: audioSummary } = useAudioSummary(bookId);
  const createAudioSummary = useCreateAudioSummary();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [audioSummary]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skipTime = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
  };

  const handleProgressChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = (value[0] / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleGenerateAudio = async () => {
    if (!bookContent) {
      toast({
        title: "Error",
        description: "Book content is required to generate audio summary.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('timeout')), 30000);
    });

    try {
      await Promise.race([
        createAudioSummary.mutateAsync({
          bookId,
          content: bookContent,
        }),
        timeoutPromise,
      ]);
      toast({
        title: "Audio Summary Generated",
        description: "Your 15-minute audio summary is ready!",
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'timeout') {
        toast({
          title: "Error",
          description: "Audio generation timed out. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate audio summary. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      clearTimeout(timeoutId);
      setIsGenerating(false);
    }
  };

  if (!audioSummary && !createAudioSummary.data) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Headphones className="w-5 h-5" />
            15-Minute Audio Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <Headphones className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-blue-700 mb-4">
              Generate an engaging 15-minute audio summary of "{bookTitle}"
            </p>
            <Button
              onClick={handleGenerateAudio}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? 'Generating...' : 'Generate Audio Summary'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const audioUrl = audioSummary?.audio_url || createAudioSummary.data?.audio_url;

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Headphones className="w-5 h-5" />
          15-Minute Audio Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
        
        {/* Waveform placeholder */}
        <div className="h-20 bg-blue-100 rounded-lg flex items-center justify-center">
          <div className="flex items-end gap-1 h-12">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className={`w-1 bg-blue-400 rounded-t ${
                  (currentTime / duration) * 50 > i ? 'bg-blue-600' : 'bg-blue-300'
                }`}
                style={{ height: `${Math.random() * 100}%` }}
              />
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={(currentTime / duration) * 100} className="w-full" />
          <div className="flex justify-between text-sm text-blue-600">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => skipTime(-15)}
            className="text-blue-700 hover:text-blue-900"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={togglePlayPause}
            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => skipTime(15)}
            className="text-blue-700 hover:text-blue-900"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Volume control */}
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-blue-600" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => {
              const newVolume = parseFloat(e.target.value);
              setVolume(newVolume);
              if (audioRef.current) {
                audioRef.current.volume = newVolume;
              }
            }}
            className="flex-1"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioSummaryPlayer;
