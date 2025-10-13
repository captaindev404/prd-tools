/**
 * Figma API client for design preview embedding
 * Based on DSL specification (integrations.design.figma)
 */

export interface FigmaFile {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
}

export interface FigmaFileInfo {
  key: string;
  name: string;
  thumbnailUrl: string | null;
  lastModified: string | null;
  isValid: boolean;
  error?: string;
}

/**
 * Extract Figma file key from URL
 * Supports formats:
 * - https://www.figma.com/file/{key}/{name}
 * - https://www.figma.com/design/{key}/{name}
 * - https://figma.com/file/{key}/{name}
 */
export function extractFigmaFileKey(url: string): string | null {
  try {
    const patterns = [
      /figma\.com\/file\/([a-zA-Z0-9]+)/,
      /figma\.com\/design\/([a-zA-Z0-9]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Validate if a URL is a valid Figma URL
 */
export function isValidFigmaUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.hostname === 'figma.com' ||
      parsedUrl.hostname === 'www.figma.com'
    );
  } catch {
    return false;
  }
}

/**
 * Figma API client
 * Requires environment variable:
 * - FIGMA_ACCESS_TOKEN: Figma Personal Access Token
 */
class FigmaClient {
  private token: string;
  private baseUrl = 'https://api.figma.com/v1';

  constructor() {
    this.token = process.env.FIGMA_ACCESS_TOKEN || '';

    if (!this.token) {
      console.warn('Figma integration not configured. Set FIGMA_ACCESS_TOKEN.');
    }
  }

  /**
   * Check if Figma is configured
   */
  isConfigured(): boolean {
    return !!this.token;
  }

  /**
   * Get file metadata
   */
  async getFile(fileKey: string): Promise<FigmaFile | null> {
    if (!this.isConfigured()) {
      throw new Error('Figma integration not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/files/${fileKey}`, {
        method: 'GET',
        headers: {
          'X-Figma-Token': this.token,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        name: data.name,
        lastModified: data.lastModified,
        thumbnailUrl: data.thumbnailUrl || '',
        version: data.version,
      };
    } catch (error) {
      console.error(`Error fetching Figma file ${fileKey}:`, error);
      throw error;
    }
  }

  /**
   * Get file thumbnail
   */
  async getFileThumbnail(
    fileKey: string,
    options?: {
      scale?: number; // 0.01 to 4
      format?: 'jpg' | 'png' | 'svg';
    }
  ): Promise<string | null> {
    if (!this.isConfigured()) {
      throw new Error('Figma integration not configured');
    }

    try {
      const scale = options?.scale || 1;
      const format = options?.format || 'png';

      const response = await fetch(
        `${this.baseUrl}/images/${fileKey}?scale=${scale}&format=${format}`,
        {
          method: 'GET',
          headers: {
            'X-Figma-Token': this.token,
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      // Returns URLs for all nodes, we'll use the first one
      const imageUrls = Object.values(data.images || {});
      return imageUrls.length > 0 ? (imageUrls[0] as string) : null;
    } catch (error) {
      console.error(`Error fetching Figma thumbnail ${fileKey}:`, error);
      return null;
    }
  }

  /**
   * Get embed URL for Figma file
   */
  getEmbedUrl(fileKey: string, nodeId?: string): string {
    let embedUrl = `https://www.figma.com/embed?embed_host=roadmap&url=https://www.figma.com/file/${fileKey}`;

    if (nodeId) {
      embedUrl += `?node-id=${nodeId}`;
    }

    return embedUrl;
  }
}

// Export singleton instance
export const figmaClient = new FigmaClient();

// Export helper functions

/**
 * Get information about multiple Figma files
 */
export async function getFigmaFileInfo(urls: string[]): Promise<FigmaFileInfo[]> {
  if (!figmaClient.isConfigured() || urls.length === 0) {
    return urls.map((url) => ({
      key: extractFigmaFileKey(url) || '',
      name: 'Unknown',
      thumbnailUrl: null,
      lastModified: null,
      isValid: false,
      error: 'Figma integration not configured',
    }));
  }

  const results: FigmaFileInfo[] = [];

  for (const url of urls) {
    const fileKey = extractFigmaFileKey(url);

    if (!fileKey) {
      results.push({
        key: '',
        name: 'Unknown',
        thumbnailUrl: null,
        lastModified: null,
        isValid: false,
        error: 'Invalid Figma URL',
      });
      continue;
    }

    try {
      const file = await figmaClient.getFile(fileKey);

      if (!file) {
        results.push({
          key: fileKey,
          name: 'Unknown',
          thumbnailUrl: null,
          lastModified: null,
          isValid: false,
          error: 'File not found',
        });
        continue;
      }

      results.push({
        key: fileKey,
        name: file.name,
        thumbnailUrl: file.thumbnailUrl,
        lastModified: file.lastModified,
        isValid: true,
      });
    } catch (error) {
      results.push({
        key: fileKey,
        name: 'Unknown',
        thumbnailUrl: null,
        lastModified: null,
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Validate Figma URLs and return valid/invalid lists
 */
export async function validateFigmaUrls(urls: string[]): Promise<{
  valid: string[];
  invalid: string[];
}> {
  const fileInfo = await getFigmaFileInfo(urls);

  const valid: string[] = [];
  const invalid: string[] = [];

  fileInfo.forEach((info, index) => {
    if (info.isValid) {
      valid.push(urls[index]);
    } else {
      invalid.push(urls[index]);
    }
  });

  return { valid, invalid };
}

/**
 * Generate Figma embed iframe HTML
 */
export function generateFigmaEmbed(
  url: string,
  options?: {
    width?: string;
    height?: string;
    allowFullscreen?: boolean;
  }
): string {
  const fileKey = extractFigmaFileKey(url);
  if (!fileKey) {
    return '';
  }

  const embedUrl = figmaClient.getEmbedUrl(fileKey);
  const width = options?.width || '100%';
  const height = options?.height || '450';
  const allowFullscreen = options?.allowFullscreen !== false;

  return `
    <iframe
      style="border: 1px solid rgba(0, 0, 0, 0.1);"
      width="${width}"
      height="${height}"
      src="${embedUrl}"
      ${allowFullscreen ? 'allowfullscreen' : ''}
    ></iframe>
  `.trim();
}
