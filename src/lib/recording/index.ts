/**
 * Recording Library
 * Comprehensive recording infrastructure for research sessions
 */

export * from './media-recorder';
export * from './screen-capture';
export * from './storage-client';
export * from './transcription';

// Re-export types for convenience
export type {
  MediaRecorderConfig,
  RecordingChunk,
  RecordingState,
  MediaRecorderEvents,
} from './media-recorder';

export type {
  ScreenCaptureConfig,
  ScreenCaptureInfo,
} from './screen-capture';

export type {
  StorageConfig,
  UploadOptions,
  SignedUrlOptions,
  DeleteOptions,
  StorageObject,
} from './storage-client';

export type {
  TranscriptionSegment,
  TranscriptionResult,
  TranscriptionOptions,
} from './transcription';
