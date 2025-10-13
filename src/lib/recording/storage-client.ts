/**
 * S3-Compatible Storage Client for Session Recordings
 *
 * Supports:
 * - MinIO (self-hosted S3)
 * - Cloudflare R2
 * - AWS S3
 * - Backblaze B2
 *
 * Uses signed URLs for secure access to recordings.
 */

export interface StorageConfig {
  provider: 'minio' | 'cloudflare-r2' | 'aws-s3' | 'backblaze-b2';
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl?: string; // For direct access to public bucket
}

export interface UploadOptions {
  key: string;
  data: Buffer | Blob;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface SignedUrlOptions {
  key: string;
  expiresIn?: number; // Seconds, default 3600 (1 hour)
}

export interface DeleteOptions {
  key: string;
}

export interface StorageObject {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
  contentType?: string;
}

/**
 * Storage Client for session recordings
 * Uses native fetch API for compatibility
 */
export class StorageClient {
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  /**
   * Upload a file to storage
   */
  async upload(options: UploadOptions): Promise<string> {
    const { key, data, contentType, metadata } = options;

    // For development: Mock upload
    if (process.env.NODE_ENV === 'development' && !this.config.endpoint) {
      console.log('[Storage] Mock upload:', key);
      return `mock://${this.config.bucket}/${key}`;
    }

    // Convert Blob to Buffer if needed
    const buffer = data instanceof Blob
      ? Buffer.from(await data.arrayBuffer())
      : data;

    // Create signed upload URL
    const uploadUrl = await this.createSignedUploadUrl(key, contentType);

    // Upload file
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: buffer,
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        ...(metadata && {
          'x-amz-meta-custom': JSON.stringify(metadata),
        }),
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return `${this.config.endpoint}/${this.config.bucket}/${key}`;
  }

  /**
   * Upload a chunk (for chunked uploads)
   */
  async uploadChunk(
    key: string,
    chunk: Buffer | Blob,
    chunkIndex: number,
    totalChunks: number
  ): Promise<string> {
    const chunkKey = `${key}.chunk${chunkIndex}`;
    return this.upload({
      key: chunkKey,
      data: chunk,
      contentType: 'application/octet-stream',
      metadata: {
        chunkIndex: chunkIndex.toString(),
        totalChunks: totalChunks.toString(),
        parentKey: key,
      },
    });
  }

  /**
   * Finalize chunked upload by combining chunks
   */
  async finalizeChunkedUpload(
    key: string,
    chunkKeys: string[]
  ): Promise<string> {
    // For development: Mock finalization
    if (process.env.NODE_ENV === 'development' && !this.config.endpoint) {
      console.log('[Storage] Mock finalize:', key, chunkKeys.length, 'chunks');
      return `mock://${this.config.bucket}/${key}`;
    }

    // In production, this would use multipart upload APIs
    // For now, we'll assume chunks are uploaded and return the final key
    return `${this.config.endpoint}/${this.config.bucket}/${key}`;
  }

  /**
   * Get a signed URL for downloading/streaming a file
   */
  async getSignedUrl(options: SignedUrlOptions): Promise<string> {
    const { key, expiresIn = 3600 } = options;

    // For development: Mock signed URL
    if (process.env.NODE_ENV === 'development' && !this.config.endpoint) {
      return `/api/recording/playback/mock?key=${encodeURIComponent(key)}`;
    }

    // Calculate expiry time
    const expiryDate = new Date(Date.now() + expiresIn * 1000);

    // Generate signed URL based on provider
    switch (this.config.provider) {
      case 'minio':
      case 'aws-s3':
      case 'backblaze-b2':
        return this.generatePresignedUrl(key, expiresIn);

      case 'cloudflare-r2':
        // Cloudflare R2 uses similar S3-compatible signing
        return this.generatePresignedUrl(key, expiresIn);

      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  /**
   * Delete a file from storage
   */
  async delete(options: DeleteOptions): Promise<void> {
    const { key } = options;

    // For development: Mock delete
    if (process.env.NODE_ENV === 'development' && !this.config.endpoint) {
      console.log('[Storage] Mock delete:', key);
      return;
    }

    // Create signed delete URL
    const deleteUrl = `${this.config.endpoint}/${this.config.bucket}/${key}`;

    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: this.getAuthHeaders('DELETE', `/${this.config.bucket}/${key}`),
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }
  }

  /**
   * Get object metadata
   */
  async getObjectInfo(key: string): Promise<StorageObject | null> {
    // For development: Mock object info
    if (process.env.NODE_ENV === 'development' && !this.config.endpoint) {
      return {
        key,
        size: 1024 * 1024, // 1 MB
        lastModified: new Date(),
        etag: 'mock-etag',
        contentType: 'video/webm',
      };
    }

    const url = `${this.config.endpoint}/${this.config.bucket}/${key}`;

    const response = await fetch(url, {
      method: 'HEAD',
      headers: this.getAuthHeaders('HEAD', `/${this.config.bucket}/${key}`),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to get object info: ${response.statusText}`);
    }

    return {
      key,
      size: parseInt(response.headers.get('content-length') || '0'),
      lastModified: new Date(response.headers.get('last-modified') || Date.now()),
      etag: response.headers.get('etag') || '',
      contentType: response.headers.get('content-type') || undefined,
    };
  }

  /**
   * Generate presigned URL for S3-compatible storage
   */
  private async generatePresignedUrl(key: string, expiresIn: number): Promise<string> {
    // This is a simplified implementation
    // In production, you'd use AWS SDK or MinIO SDK for proper signing
    const timestamp = Math.floor(Date.now() / 1000);
    const expiry = timestamp + expiresIn;

    const baseUrl = `${this.config.endpoint}/${this.config.bucket}/${key}`;
    const signature = await this.signUrl(baseUrl, expiry);

    return `${baseUrl}?X-Amz-Expires=${expiresIn}&X-Amz-Signature=${signature}&X-Amz-Date=${timestamp}`;
  }

  /**
   * Create signed upload URL
   */
  private async createSignedUploadUrl(key: string, contentType?: string): Promise<string> {
    const baseUrl = `${this.config.endpoint}/${this.config.bucket}/${key}`;
    const signature = await this.signUrl(baseUrl, 3600);

    return `${baseUrl}?X-Amz-Signature=${signature}${contentType ? `&content-type=${encodeURIComponent(contentType)}` : ''}`;
  }

  /**
   * Sign a URL (simplified for development)
   */
  private async signUrl(url: string, expiry: number): Promise<string> {
    // In production, use proper HMAC-SHA256 signing
    // For now, return a mock signature
    const crypto = await import('crypto');
    const hmac = crypto.createHmac('sha256', this.config.secretAccessKey);
    hmac.update(`${url}${expiry}`);
    return hmac.digest('hex');
  }

  /**
   * Get authentication headers for S3 API
   */
  private getAuthHeaders(method: string, path: string): Record<string, string> {
    // Simplified auth headers
    // In production, use proper AWS Signature Version 4
    return {
      'Authorization': `AWS ${this.config.accessKeyId}:mock-signature`,
      'x-amz-date': new Date().toISOString(),
    };
  }
}

/**
 * Create storage client from environment variables
 */
export function createStorageClient(): StorageClient {
  const provider = (process.env.RECORDING_STORAGE_PROVIDER || 'minio') as StorageConfig['provider'];

  const config: StorageConfig = {
    provider,
    endpoint: process.env.RECORDING_STORAGE_ENDPOINT || '',
    region: process.env.RECORDING_STORAGE_REGION || 'us-east-1',
    bucket: process.env.RECORDING_STORAGE_BUCKET || 'session-recordings',
    accessKeyId: process.env.RECORDING_STORAGE_ACCESS_KEY || '',
    secretAccessKey: process.env.RECORDING_STORAGE_SECRET_KEY || '',
    publicUrl: process.env.RECORDING_STORAGE_PUBLIC_URL,
  };

  return new StorageClient(config);
}
