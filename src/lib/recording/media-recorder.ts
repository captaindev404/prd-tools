/**
 * Browser MediaRecorder API Wrapper
 * Handles camera and microphone recording for research sessions
 */

export interface MediaRecorderConfig {
  mimeType?: string;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
  chunkSizeMs?: number; // Timeslice for chunks in milliseconds
}

export interface RecordingChunk {
  data: Blob;
  timestamp: number;
  index: number;
}

export type RecordingState = 'inactive' | 'recording' | 'paused';

export interface MediaRecorderEvents {
  onDataAvailable?: (chunk: RecordingChunk) => void;
  onStart?: () => void;
  onStop?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Wrapper for MediaRecorder API with chunked recording support
 */
export class MediaRecorderWrapper {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private chunkIndex = 0;
  private config: MediaRecorderConfig;
  private events: MediaRecorderEvents;

  constructor(config: MediaRecorderConfig = {}, events: MediaRecorderEvents = {}) {
    this.config = {
      mimeType: config.mimeType || this.getPreferredMimeType(),
      videoBitsPerSecond: config.videoBitsPerSecond || 2500000, // 2.5 Mbps
      audioBitsPerSecond: config.audioBitsPerSecond || 128000, // 128 kbps
      chunkSizeMs: config.chunkSizeMs || 10000, // 10 seconds
    };
    this.events = events;
  }

  /**
   * Start recording from camera and microphone
   */
  async startCameraRecording(
    constraints: MediaStreamConstraints = {
      video: { width: 1280, height: 720, facingMode: 'user' },
      audio: { echoCancellation: true, noiseSuppression: true },
    }
  ): Promise<void> {
    try {
      // Request camera and microphone access
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Initialize MediaRecorder
      this.initializeRecorder(this.stream);

      // Start recording
      this.mediaRecorder?.start(this.config.chunkSizeMs);
      this.events.onStart?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to start recording');
      this.events.onError?.(err);
      throw err;
    }
  }

  /**
   * Start recording from screen share
   */
  async startScreenRecording(
    constraints: DisplayMediaStreamOptions = {
      video: { cursor: 'always' },
      audio: { echoCancellation: true },
    }
  ): Promise<void> {
    try {
      // Request screen capture access
      this.stream = await navigator.mediaDevices.getDisplayMedia(constraints);

      // Initialize MediaRecorder
      this.initializeRecorder(this.stream);

      // Start recording
      this.mediaRecorder?.start(this.config.chunkSizeMs);
      this.events.onStart?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to start screen recording');
      this.events.onError?.(err);
      throw err;
    }
  }

  /**
   * Start combined recording (camera + screen)
   */
  async startCombinedRecording(): Promise<void> {
    try {
      // Get both camera and screen streams
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: true,
      });

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: true,
      });

      // Combine streams (screen video + camera audio)
      const tracks = [
        ...screenStream.getVideoTracks(),
        ...cameraStream.getAudioTracks(),
      ];

      this.stream = new MediaStream(tracks);

      // Store both streams for cleanup
      (this.stream as any)._cameraStream = cameraStream;
      (this.stream as any)._screenStream = screenStream;

      // Initialize MediaRecorder
      this.initializeRecorder(this.stream);

      // Start recording
      this.mediaRecorder?.start(this.config.chunkSizeMs);
      this.events.onStart?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to start combined recording');
      this.events.onError?.(err);
      throw err;
    }
  }

  /**
   * Pause recording
   */
  pause(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause();
      this.events.onPause?.();
    }
  }

  /**
   * Resume recording
   */
  resume(): void {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume();
      this.events.onResume?.();
    }
  }

  /**
   * Stop recording
   */
  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      // Store resolve callback
      const handleStop = () => {
        const blob = new Blob(this.chunks, { type: this.config.mimeType });
        this.cleanup();
        this.events.onStop?.();
        resolve(blob);
      };

      this.mediaRecorder.addEventListener('stop', handleStop, { once: true });
      this.mediaRecorder.stop();
    });
  }

  /**
   * Get current recording state
   */
  getState(): RecordingState {
    return this.mediaRecorder?.state || 'inactive';
  }

  /**
   * Get current media stream (for preview)
   */
  getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Get recording duration in milliseconds
   */
  getDuration(): number {
    // Estimate based on chunks
    return this.chunks.length * (this.config.chunkSizeMs || 10000);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Stop all tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());

      // Stop additional streams if combined recording
      const cameraStream = (this.stream as any)._cameraStream;
      const screenStream = (this.stream as any)._screenStream;

      if (cameraStream) {
        cameraStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
    }

    this.stream = null;
    this.mediaRecorder = null;
    this.chunks = [];
    this.chunkIndex = 0;
  }

  /**
   * Initialize MediaRecorder with stream
   */
  private initializeRecorder(stream: MediaStream): void {
    const options: MediaRecorderOptions = {
      mimeType: this.config.mimeType,
      videoBitsPerSecond: this.config.videoBitsPerSecond,
      audioBitsPerSecond: this.config.audioBitsPerSecond,
    };

    this.mediaRecorder = new MediaRecorder(stream, options);

    // Handle data available
    this.mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        this.chunks.push(event.data);

        // Emit chunk event
        this.events.onDataAvailable?.({
          data: event.data,
          timestamp: Date.now(),
          index: this.chunkIndex++,
        });
      }
    });

    // Handle errors
    this.mediaRecorder.addEventListener('error', (event: Event) => {
      const error = new Error('MediaRecorder error');
      this.events.onError?.(error);
    });
  }

  /**
   * Get preferred MIME type for the browser
   */
  private getPreferredMimeType(): string {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'video/webm'; // Fallback
  }
}

/**
 * Check if browser supports recording
 */
export function isRecordingSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    window.MediaRecorder
  );
}

/**
 * Check if screen recording is supported
 */
export function isScreenRecordingSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getDisplayMedia
  );
}

/**
 * Get available video input devices
 */
export async function getVideoDevices(): Promise<MediaDeviceInfo[]> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return [];
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(device => device.kind === 'videoinput');
}

/**
 * Get available audio input devices
 */
export async function getAudioDevices(): Promise<MediaDeviceInfo[]> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return [];
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(device => device.kind === 'audioinput');
}
