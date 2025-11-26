import { getDownloadUrl, R2_PUBLIC_URL } from './r2-client';

/**
 * Default expiration time for signed URLs (15 minutes)
 * This provides a good balance between security and user experience
 */
const DEFAULT_EXPIRY_SECONDS = 15 * 60;

/**
 * Maximum expiration time allowed (1 hour)
 */
const MAX_EXPIRY_SECONDS = 60 * 60;

/**
 * Extract the R2 key from a stored URL or key
 * Handles both full URLs and bare keys
 */
export function extractR2Key(urlOrKey: string): string {
  if (!urlOrKey) return '';

  // If it's already a key (no http), return as-is
  if (!urlOrKey.startsWith('http')) {
    return urlOrKey;
  }

  // Extract key from public URL
  if (urlOrKey.startsWith(R2_PUBLIC_URL)) {
    return urlOrKey.replace(`${R2_PUBLIC_URL}/`, '');
  }

  // Try to extract from any R2 URL pattern
  const r2Patterns = [
    /r2\.cloudflarestorage\.com\/[^/]+\/(.+)$/,
    /r2\.dev\/(.+)$/,
    /\/([^/]+\/[^/]+\/[^/]+\.(mp3|png|jpg|jpeg|webp))$/,
  ];

  for (const pattern of r2Patterns) {
    const match = urlOrKey.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // If nothing matches, assume it's a key
  return urlOrKey;
}

/**
 * Generate a signed URL for secure file access
 *
 * @param urlOrKey - The stored URL or R2 key
 * @param expiresIn - Expiration time in seconds (default: 15 minutes, max: 1 hour)
 * @returns Signed URL with limited-time access
 */
export async function generateSignedUrl(
  urlOrKey: string,
  expiresIn: number = DEFAULT_EXPIRY_SECONDS
): Promise<string> {
  if (!urlOrKey) {
    throw new Error('URL or key is required');
  }

  // Enforce maximum expiry
  const safeExpiry = Math.min(expiresIn, MAX_EXPIRY_SECONDS);

  // Extract the key from the URL if needed
  const key = extractR2Key(urlOrKey);

  if (!key) {
    throw new Error('Could not extract R2 key from URL');
  }

  // Generate signed URL
  return getDownloadUrl({
    key,
    expiresIn: safeExpiry,
  });
}

/**
 * Sign multiple URLs at once (for batch operations)
 */
export async function generateSignedUrls(
  urlsOrKeys: string[],
  expiresIn: number = DEFAULT_EXPIRY_SECONDS
): Promise<string[]> {
  return Promise.all(
    urlsOrKeys.map(urlOrKey => generateSignedUrl(urlOrKey, expiresIn))
  );
}

/**
 * Sign all URL fields in an object
 * Looks for fields ending in 'Url' or 'url' and signs them
 */
export async function signObjectUrls<T extends Record<string, unknown>>(
  obj: T,
  urlFields: (keyof T)[],
  expiresIn: number = DEFAULT_EXPIRY_SECONDS
): Promise<T> {
  const result = { ...obj };

  await Promise.all(
    urlFields.map(async (field) => {
      const value = obj[field];
      if (typeof value === 'string' && value) {
        (result as Record<string, unknown>)[field as string] = await generateSignedUrl(value, expiresIn);
      }
    })
  );

  return result;
}

/**
 * Sign URLs in a story object
 */
export async function signStoryUrls(story: {
  audioUrl?: string | null;
  illustrations?: Array<{ imageUrl?: string | null; [key: string]: unknown }>;
  [key: string]: unknown;
}): Promise<typeof story> {
  const result = { ...story };

  // Sign audio URL if present
  if (story.audioUrl) {
    result.audioUrl = await generateSignedUrl(story.audioUrl);
  }

  // Sign illustration URLs if present
  if (story.illustrations && Array.isArray(story.illustrations)) {
    result.illustrations = await Promise.all(
      story.illustrations.map(async (ill) => {
        // Only sign if imageUrl exists and is not empty
        if (ill.imageUrl) {
          return {
            ...ill,
            imageUrl: await generateSignedUrl(ill.imageUrl),
          };
        }
        // Return as-is if no imageUrl
        return ill;
      })
    );
  }

  return result;
}

/**
 * Sign URLs in a hero object
 */
export async function signHeroUrls(hero: {
  avatarUrl?: string | null;
  [key: string]: unknown;
}): Promise<typeof hero> {
  if (!hero.avatarUrl) {
    return hero;
  }

  return {
    ...hero,
    avatarUrl: await generateSignedUrl(hero.avatarUrl),
  };
}
