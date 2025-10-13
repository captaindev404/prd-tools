'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  MessageSquare,
  Bookmark,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export interface Annotation {
  id: string;
  timestamp: number; // Seconds
  text: string;
  author: string;
  authorId: string;
  type: 'note' | 'highlight' | 'issue';
  createdAt: string;
}

export interface Highlight {
  id: string;
  start: number;
  end: number;
  label: string;
  color: string;
}

export interface VideoPlayerProps {
  recordingId: string;
  videoUrl: string;
  annotations?: Annotation[];
  highlights?: Highlight[];
  onAddAnnotation?: (timestamp: number, text: string, type: Annotation['type']) => Promise<void>;
  onAddHighlight?: (start: number, end: number, label: string) => Promise<void>;
  canAnnotate?: boolean;
}

export function VideoPlayer({
  recordingId,
  videoUrl,
  annotations = [],
  highlights = [],
  onAddAnnotation,
  onAddHighlight,
  canAnnotate = false,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAnnotationDialog, setShowAnnotationDialog] = useState(false);
  const [annotationText, setAnnotationText] = useState('');
  const [annotationType, setAnnotationType] = useState<Annotation['type']>('note');
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
    };
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!videoRef.current) return;
    const newVolume = value[0];
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
  };

  const jumpToTime = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const addAnnotation = async () => {
    if (!annotationText.trim() || !onAddAnnotation) return;

    try {
      await onAddAnnotation(currentTime, annotationText, annotationType);
      setAnnotationText('');
      setShowAnnotationDialog(false);
    } catch (error) {
      console.error('Failed to add annotation:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnnotationsAtTime = (time: number, threshold: number = 5): Annotation[] => {
    return annotations.filter(
      ann => Math.abs(ann.timestamp - time) <= threshold
    );
  };

  const currentAnnotations = getAnnotationsAtTime(currentTime);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Recording</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Container */}
        <div
          ref={containerRef}
          className="relative aspect-video bg-black rounded-lg overflow-hidden group"
        >
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Highlights Overlay */}
          <div className="absolute bottom-20 left-0 right-0 px-4">
            <div className="relative h-1 bg-white/20 rounded">
              {highlights.map(highlight => {
                const startPercent = (highlight.start / duration) * 100;
                const widthPercent = ((highlight.end - highlight.start) / duration) * 100;

                return (
                  <div
                    key={highlight.id}
                    className="absolute h-full rounded"
                    style={{
                      left: `${startPercent}%`,
                      width: `${widthPercent}%`,
                      backgroundColor: highlight.color,
                      opacity: 0.6,
                    }}
                    title={highlight.label}
                  />
                );
              })}
            </div>
          </div>

          {/* Current Annotations */}
          {currentAnnotations.length > 0 && (
            <div className="absolute top-4 right-4 space-y-2 max-w-xs">
              {currentAnnotations.map(ann => (
                <div
                  key={ann.id}
                  className="bg-black/80 text-white p-3 rounded-lg text-sm cursor-pointer hover:bg-black/90"
                  onClick={() => setSelectedAnnotation(ann)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-3 w-3" />
                    <span className="font-medium">{ann.author}</span>
                    <Badge variant="outline" className="text-xs">
                      {ann.type}
                    </Badge>
                  </div>
                  <p className="line-clamp-2">{ann.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Progress Bar */}
            <div className="mb-4">
              <Slider
                value={[currentTime]}
                max={duration}
                step={0.1}
                onValueChange={handleSeek}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-white mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => skip(-10)}
                  className="text-white hover:bg-white/20"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => skip(10)}
                  className="text-white hover:bg-white/20"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2 ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="w-24"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canAnnotate && (
                  <Dialog open={showAnnotationDialog} onOpenChange={setShowAnnotationDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Add Note
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Annotation at {formatTime(currentTime)}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          {(['note', 'highlight', 'issue'] as const).map(type => (
                            <Button
                              key={type}
                              size="sm"
                              variant={annotationType === type ? 'default' : 'outline'}
                              onClick={() => setAnnotationType(type)}
                            >
                              {type}
                            </Button>
                          ))}
                        </div>
                        <Textarea
                          value={annotationText}
                          onChange={e => setAnnotationText(e.target.value)}
                          placeholder="Enter your note..."
                          rows={4}
                        />
                        <Button onClick={addAnnotation} className="w-full">
                          Add Annotation
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Annotation Timeline */}
        {annotations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Annotations ({annotations.length})</h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {annotations.map(ann => (
                <div
                  key={ann.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => jumpToTime(ann.timestamp)}
                >
                  <div className="flex-shrink-0">
                    <Badge variant="outline">{formatTime(ann.timestamp)}</Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{ann.author}</span>
                      <Badge variant="secondary" className="text-xs">
                        {ann.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{ann.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
