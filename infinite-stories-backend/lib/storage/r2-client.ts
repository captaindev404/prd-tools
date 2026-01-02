import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Lazy initialization of R2 client
let _r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!_r2Client) {
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
      throw new Error('Missing required R2 environment variables');
    }

    _r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }

  return _r2Client;
}

export const r2Client = getR2Client;
export const R2_BUCKET = process.env.R2_BUCKET_NAME || '';
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || `https://${R2_BUCKET}.r2.dev`;

/**
 * Sanitize metadata values for S3/R2 compatibility.
 * S3 metadata values must be ASCII-safe; non-ASCII characters cause signature mismatches.
 */
function sanitizeMetadata(metadata?: Record<string, string>): Record<string, string> | undefined {
  if (!metadata) return undefined;

  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata)) {
    // URL-encode the value to make it ASCII-safe
    sanitized[key] = encodeURIComponent(value);
  }
  return sanitized;
}

/**
 * Upload a file to R2
 */
export async function uploadToR2(params: {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType: string;
  metadata?: Record<string, string>;
}): Promise<string> {
  const { key, body, contentType, metadata } = params;
  const client = r2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: sanitizeMetadata(metadata),
    })
  );

  return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Get a signed URL for uploading directly from client
 */
export async function getUploadUrl(params: {
  key: string;
  contentType: string;
  expiresIn?: number;
}): Promise<string> {
  const { key, contentType, expiresIn = 3600 } = params;
  const client = r2Client();

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Get a signed URL for downloading a file
 */
export async function getDownloadUrl(params: {
  key: string;
  expiresIn?: number;
}): Promise<string> {
  const { key, expiresIn = 3600 } = params;
  const client = r2Client();

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  const client = r2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  );
}

/**
 * Check if a file exists in R2
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const client = r2Client();
    await client.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate a unique key for a file
 */
export function generateFileKey(params: {
  userId: string;
  type: 'avatar' | 'audio' | 'illustration';
  filename: string;
}): string {
  const { userId, type, filename } = params;
  const timestamp = Date.now();
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${type}/${userId}/${timestamp}-${sanitized}`;
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}
