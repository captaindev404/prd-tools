/**
 * Screen Capture API Wrapper
 * Handles screen sharing and capture for user testing sessions
 */

export interface ScreenCaptureConfig {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
  cursor?: 'never' | 'always' | 'motion';
  displaySurface?: 'monitor' | 'window' | 'browser';
  selfBrowserSurface?: 'include' | 'exclude';
  surfaceSwitching?: 'include' | 'exclude';
  systemAudio?: 'include' | 'exclude';
}

export interface ScreenCaptureInfo {
  width: number;
  height: number;
  frameRate: number;
  displaySurface?: string;
}

/**
 * Screen Capture Manager for research sessions
 */
export class ScreenCapture {
  private stream: MediaStream | null = null;
  private displaySurface: string | null = null;

  /**
   * Start screen capture
   */
  async start(config: ScreenCaptureConfig = {}): Promise<MediaStream> {
    try {
      // Default configuration
      const constraints: DisplayMediaStreamOptions = {
        video: config.video !== false ? {
          cursor: config.cursor || 'always',
          displaySurface: config.displaySurface,
          ...(typeof config.video === 'object' ? config.video : {}),
        } : false,
        audio: config.audio !== false ? {
          echoCancellation: true,
          noiseSuppression: true,
          ...(typeof config.audio === 'object' ? config.audio : {}),
        } : false,
      };

      // Additional options (Chrome-specific)
      const options = {
        selfBrowserSurface: config.selfBrowserSurface || 'exclude',
        surfaceSwitching: config.surfaceSwitching || 'include',
        systemAudio: config.systemAudio || 'exclude',
      };

      // Request screen capture
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        ...constraints,
        ...(options as any), // Type-safe override
      });

      // Detect display surface (monitor, window, or browser tab)
      const videoTrack = this.stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        this.displaySurface = (settings as any).displaySurface || 'unknown';
      }

      // Listen for user stopping share via browser UI
      this.stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        this.stop();
      });

      return this.stream;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? `Screen capture failed: ${error.message}`
          : 'Screen capture failed'
      );
    }
  }

  /**
   * Stop screen capture
   */
  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
      this.displaySurface = null;
    }
  }

  /**
   * Get current stream
   */
  getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Check if currently capturing
   */
  isCapturing(): boolean {
    return this.stream !== null && this.stream.active;
  }

  /**
   * Get capture information
   */
  getCaptureInfo(): ScreenCaptureInfo | null {
    if (!this.stream) {
      return null;
    }

    const videoTrack = this.stream.getVideoTracks()[0];
    if (!videoTrack) {
      return null;
    }

    const settings = videoTrack.getSettings();

    return {
      width: settings.width || 0,
      height: settings.height || 0,
      frameRate: settings.frameRate || 0,
      displaySurface: this.displaySurface || undefined,
    };
  }

  /**
   * Take a screenshot from the current capture
   */
  async takeScreenshot(): Promise<Blob | null> {
    if (!this.stream) {
      return null;
    }

    const videoTrack = this.stream.getVideoTracks()[0];
    if (!videoTrack) {
      return null;
    }

    // Create image capture
    const imageCapture = new (window as any).ImageCapture(videoTrack);

    try {
      const blob = await imageCapture.takePhoto();
      return blob;
    } catch (error) {
      console.error('Screenshot failed:', error);
      return null;
    }
  }

  /**
   * Add audio track to existing capture
   */
  async addAudioTrack(constraints: MediaTrackConstraints = {}): Promise<void> {
    if (!this.stream) {
      throw new Error('No active capture');
    }

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          ...constraints,
        },
      });

      const audioTrack = audioStream.getAudioTracks()[0];
      if (audioTrack) {
        this.stream.addTrack(audioTrack);
      }
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? `Failed to add audio: ${error.message}`
          : 'Failed to add audio'
      );
    }
  }

  /**
   * Remove audio track from capture
   */
  removeAudioTrack(): void {
    if (!this.stream) {
      return;
    }

    const audioTracks = this.stream.getAudioTracks();
    audioTracks.forEach(track => {
      this.stream?.removeTrack(track);
      track.stop();
    });
  }

  /**
   * Replace video track (for switching display surface)
   */
  async replaceVideoTrack(newStream: MediaStream): Promise<void> {
    if (!this.stream) {
      throw new Error('No active capture');
    }

    const oldVideoTrack = this.stream.getVideoTracks()[0];
    const newVideoTrack = newStream.getVideoTracks()[0];

    if (oldVideoTrack && newVideoTrack) {
      this.stream.removeTrack(oldVideoTrack);
      oldVideoTrack.stop();
      this.stream.addTrack(newVideoTrack);

      // Update display surface
      const settings = newVideoTrack.getSettings();
      this.displaySurface = (settings as any).displaySurface || 'unknown';
    }
  }
}

/**
 * Check if screen capture is supported
 */
export function isScreenCaptureSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getDisplayMedia
  );
}

/**
 * Check if system audio capture is supported
 */
export function isSystemAudioSupported(): boolean {
  // Chrome 105+ supports system audio
  // Check via feature detection
  return 'getDisplayMedia' in navigator.mediaDevices;
}

/**
 * Get browser capabilities for screen capture
 */
export function getScreenCaptureCapabilities() {
  return {
    supported: isScreenCaptureSupported(),
    systemAudio: isSystemAudioSupported(),
    selfBrowserSurface: true, // Most modern browsers support this
    surfaceSwitching: true, // Most modern browsers support this
  };
}
