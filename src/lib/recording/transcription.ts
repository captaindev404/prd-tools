/**
 * Audio Transcription using OpenAI Whisper API
 * Converts recorded audio to text with timestamps
 */

export interface TranscriptionSegment {
  id: number;
  start: number; // Seconds
  end: number; // Seconds
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

export interface TranscriptionResult {
  text: string;
  segments?: TranscriptionSegment[];
  language?: string;
  duration?: number;
}

export interface TranscriptionOptions {
  language?: string; // ISO-639-1 code (e.g., 'en', 'fr')
  prompt?: string; // Context to improve accuracy
  temperature?: number; // 0-1, controls randomness
  responseFormat?: 'json' | 'text' | 'srt' | 'vtt' | 'verbose_json';
}

/**
 * Transcribe audio using OpenAI Whisper API
 */
export async function transcribeAudio(
  audioFile: File | Blob,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Prepare form data
  const formData = new FormData();
  formData.append('file', audioFile, 'audio.webm');
  formData.append('model', 'whisper-1');

  if (options.language) {
    formData.append('language', options.language);
  }

  if (options.prompt) {
    formData.append('prompt', options.prompt);
  }

  if (options.temperature !== undefined) {
    formData.append('temperature', options.temperature.toString());
  }

  formData.append('response_format', options.responseFormat || 'verbose_json');

  // Call Whisper API
  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Transcription failed: ${error.error || response.statusText}`);
    }

    const result = await response.json();

    // Handle different response formats
    if (options.responseFormat === 'text') {
      return {
        text: result,
      };
    }

    if (options.responseFormat === 'verbose_json') {
      return {
        text: result.text,
        segments: result.segments,
        language: result.language,
        duration: result.duration,
      };
    }

    // Default JSON format
    return {
      text: result.text,
      language: result.language,
    };
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Transcription error: ${error.message}`
        : 'Transcription failed'
    );
  }
}

/**
 * Extract audio from video file
 */
export async function extractAudioFromVideo(videoFile: Blob): Promise<Blob> {
  // This requires ffmpeg.js or similar library
  // For now, return a mock implementation
  // In production, you'd use:
  // 1. Server-side processing with ffmpeg
  // 2. Browser-based ffmpeg.wasm
  // 3. MediaRecorder with audio-only track

  throw new Error('Audio extraction not yet implemented. Use server-side processing.');
}

/**
 * Convert transcription to SRT format
 */
export function convertToSRT(segments: TranscriptionSegment[]): string {
  return segments
    .map((segment, index) => {
      const startTime = formatSRTTimestamp(segment.start);
      const endTime = formatSRTTimestamp(segment.end);

      return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text.trim()}\n`;
    })
    .join('\n');
}

/**
 * Convert transcription to WebVTT format
 */
export function convertToVTT(segments: TranscriptionSegment[]): string {
  const header = 'WEBVTT\n\n';

  const cues = segments
    .map(segment => {
      const startTime = formatVTTTimestamp(segment.start);
      const endTime = formatVTTTimestamp(segment.end);

      return `${startTime} --> ${endTime}\n${segment.text.trim()}\n`;
    })
    .join('\n');

  return header + cues;
}

/**
 * Search transcript for keywords
 */
export function searchTranscript(
  segments: TranscriptionSegment[],
  query: string
): Array<{ segment: TranscriptionSegment; match: string }> {
  const results: Array<{ segment: TranscriptionSegment; match: string }> = [];
  const lowerQuery = query.toLowerCase();

  for (const segment of segments) {
    if (segment.text.toLowerCase().includes(lowerQuery)) {
      results.push({
        segment,
        match: segment.text,
      });
    }
  }

  return results;
}

/**
 * Get transcript excerpt around a timestamp
 */
export function getTranscriptExcerpt(
  segments: TranscriptionSegment[],
  timestamp: number,
  contextSeconds: number = 30
): TranscriptionSegment[] {
  return segments.filter(
    segment =>
      (segment.start >= timestamp - contextSeconds && segment.start <= timestamp + contextSeconds) ||
      (segment.end >= timestamp - contextSeconds && segment.end <= timestamp + contextSeconds)
  );
}

/**
 * Format seconds to SRT timestamp (HH:MM:SS,mmm)
 */
function formatSRTTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)},${pad(millis, 3)}`;
}

/**
 * Format seconds to WebVTT timestamp (HH:MM:SS.mmm)
 */
function formatVTTTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)}.${pad(millis, 3)}`;
}

/**
 * Pad number with leading zeros
 */
function pad(num: number, size: number): string {
  return num.toString().padStart(size, '0');
}

/**
 * Check if transcription is available
 */
export function isTranscriptionAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Estimate transcription cost
 * OpenAI Whisper pricing: $0.006 per minute
 */
export function estimateTranscriptionCost(durationMinutes: number): number {
  const pricePerMinute = 0.006; // USD
  return durationMinutes * pricePerMinute;
}

/**
 * Split long audio file into chunks for processing
 */
export async function splitAudioFile(
  audioBlob: Blob,
  maxDurationSeconds: number = 600 // 10 minutes
): Promise<Blob[]> {
  // This would require audio processing
  // For now, return single blob
  // In production, use Web Audio API or server-side processing
  return [audioBlob];
}
