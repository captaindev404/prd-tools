'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Circle,
  Square,
  Pause,
  Play,
  Upload,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MediaRecorderWrapper,
  isRecordingSupported,
  isScreenRecordingSupported,
  getVideoDevices,
  getAudioDevices,
} from '@/lib/recording';

export interface RecordingControlsProps {
  sessionId: string;
  onRecordingStart?: (recordingId: string) => void;
  onRecordingStop?: (blob: Blob, duration: number) => void;
  onError?: (error: Error) => void;
}

type RecordingMode = 'camera' | 'screen' | 'both';
type RecordingStatus = 'idle' | 'recording' | 'paused' | 'uploading' | 'error';

export function RecordingControls({
  sessionId,
  onRecordingStart,
  onRecordingStop,
  onError,
}: RecordingControlsProps) {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [mode, setMode] = useState<RecordingMode>('camera');
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');

  const recorderRef = useRef<MediaRecorderWrapper | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Check browser support
  const supported = isRecordingSupported();
  const screenSupported = isScreenRecordingSupported();

  // Load devices on mount
  useEffect(() => {
    loadDevices();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const loadDevices = async () => {
    try {
      const [video, audio] = await Promise.all([
        getVideoDevices(),
        getAudioDevices(),
      ]);
      setVideoDevices(video);
      setAudioDevices(audio);

      if (video.length > 0) setSelectedVideoDevice(video[0].deviceId);
      if (audio.length > 0) setSelectedAudioDevice(audio[0].deviceId);
    } catch (err) {
      console.error('Failed to load devices:', err);
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      setStatus('idle');

      // Initialize recording metadata
      const response = await fetch(`/api/recording/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          type: mode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize recording');
      }

      const { recordingId: newRecordingId } = await response.json();
      setRecordingId(newRecordingId);

      // Create recorder
      const recorder = new MediaRecorderWrapper(
        {
          chunkSizeMs: 10000, // 10 second chunks
        },
        {
          onDataAvailable: (chunk) => {
            chunksRef.current.push(chunk.data);
            uploadChunk(newRecordingId, chunk.data, chunk.index);
          },
          onStart: () => {
            setStatus('recording');
            startTimer();
            onRecordingStart?.(newRecordingId);
          },
          onError: (err) => {
            setError(err.message);
            setStatus('error');
            onError?.(err);
          },
        }
      );

      recorderRef.current = recorder;

      // Start recording based on mode
      if (mode === 'camera') {
        await recorder.startCameraRecording({
          video: cameraEnabled ? {
            deviceId: selectedVideoDevice || undefined,
            width: 1280,
            height: 720,
          } : false,
          audio: audioEnabled ? {
            deviceId: selectedAudioDevice || undefined,
          } : false,
        });
      } else if (mode === 'screen') {
        await recorder.startScreenRecording();
      } else {
        await recorder.startCombinedRecording();
      }

      // Show preview
      if (previewRef.current && recorder.getStream()) {
        previewRef.current.srcObject = recorder.getStream();
        previewRef.current.play();
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start recording');
      setError(error.message);
      setStatus('error');
      onError?.(error);
    }
  };

  const pauseRecording = () => {
    recorderRef.current?.pause();
    setStatus('paused');
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    recorderRef.current?.resume();
    setStatus('recording');
    startTimer();
  };

  const stopRecording = async () => {
    if (!recorderRef.current || !recordingId) return;

    try {
      setStatus('uploading');

      // Stop recording
      const blob = await recorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Finalize recording
      await finalizeRecording(recordingId, blob);

      // Callback
      onRecordingStop?.(blob, duration);

      // Reset state
      setStatus('idle');
      setDuration(0);
      setRecordingId(null);
      chunksRef.current = [];

      // Clear preview
      if (previewRef.current) {
        previewRef.current.srcObject = null;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to stop recording');
      setError(error.message);
      setStatus('error');
      onError?.(error);
    }
  };

  const uploadChunk = async (recordingId: string, chunk: Blob, index: number) => {
    try {
      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('index', index.toString());

      await fetch(`/api/recording/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Recording-Id': recordingId,
        },
      });
    } catch (err) {
      console.error('Chunk upload failed:', err);
    }
  };

  const finalizeRecording = async (recordingId: string, finalBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('file', finalBlob, 'recording.webm');

      await fetch(`/api/recording/finalize`, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Recording-Id': recordingId,
        },
      });
    } catch (err) {
      throw new Error('Failed to finalize recording');
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!supported) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Your browser does not support video recording. Please use Chrome, Firefox, or Edge.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Recording Preview */}
        {status !== 'idle' && (
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={previewRef}
              className="w-full h-full object-contain"
              muted
              playsInline
            />
            <div className="absolute top-4 left-4 flex items-center gap-2">
              {status === 'recording' && (
                <>
                  <Circle className="h-3 w-3 text-red-500 fill-red-500 animate-pulse" />
                  <span className="text-white text-sm font-medium">
                    REC {formatDuration(duration)}
                  </span>
                </>
              )}
              {status === 'paused' && (
                <Badge variant="secondary">Paused {formatDuration(duration)}</Badge>
              )}
              {status === 'uploading' && (
                <Badge>Uploading...</Badge>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        {status === 'idle' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={mode === 'camera' ? 'default' : 'outline'}
                onClick={() => setMode('camera')}
                className="w-full"
              >
                <Video className="mr-2 h-4 w-4" />
                Camera
              </Button>
              <Button
                variant={mode === 'screen' ? 'default' : 'outline'}
                onClick={() => setMode('screen')}
                disabled={!screenSupported}
                className="w-full"
              >
                <Monitor className="mr-2 h-4 w-4" />
                Screen
              </Button>
              <Button
                variant={mode === 'both' ? 'default' : 'outline'}
                onClick={() => setMode('both')}
                disabled={!screenSupported}
                className="w-full"
              >
                <Video className="mr-2 h-4 w-4" />
                Both
              </Button>
            </div>

            {mode === 'camera' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant={cameraEnabled ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCameraEnabled(!cameraEnabled)}
                  >
                    {cameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                  <Select value={selectedVideoDevice} onValueChange={setSelectedVideoDevice}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select camera" />
                    </SelectTrigger>
                    <SelectContent>
                      {videoDevices.map(device => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${device.deviceId.substring(0, 8)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={audioEnabled ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAudioEnabled(!audioEnabled)}
                  >
                    {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                  <Select value={selectedAudioDevice} onValueChange={setSelectedAudioDevice}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select microphone" />
                    </SelectTrigger>
                    <SelectContent>
                      {audioDevices.map(device => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label || `Microphone ${device.deviceId.substring(0, 8)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-2">
          {status === 'idle' && (
            <Button onClick={startRecording} size="lg" className="w-full">
              <Circle className="mr-2 h-4 w-4" />
              Start Recording
            </Button>
          )}

          {status === 'recording' && (
            <>
              <Button onClick={pauseRecording} variant="outline" size="lg">
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
              <Button onClick={stopRecording} variant="destructive" size="lg">
                <Square className="mr-2 h-4 w-4" />
                Stop
              </Button>
            </>
          )}

          {status === 'paused' && (
            <>
              <Button onClick={resumeRecording} variant="default" size="lg">
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
              <Button onClick={stopRecording} variant="destructive" size="lg">
                <Square className="mr-2 h-4 w-4" />
                Stop
              </Button>
            </>
          )}

          {status === 'uploading' && (
            <Button disabled size="lg" className="w-full">
              <Upload className="mr-2 h-4 w-4 animate-pulse" />
              Uploading...
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
