/**
 * Figma link validation utilities
 *
 * Validates Figma URLs for file, proto, and design links
 */

const ALLOWED_DOMAINS = ['figma.com', 'www.figma.com'];
const ALLOWED_PATH_TYPES = ['file', 'proto', 'design'];

/**
 * Validate Figma URL format
 *
 * Pattern: https://([a-z]+\.)?figma.com/(file|proto|design)/.+
 *
 * @param url - The Figma URL to validate
 * @returns true if valid, false otherwise
 */
export function validateFigmaUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsedUrl = new URL(url);

    // Check if it's from figma.com domain
    const isDomainValid = ALLOWED_DOMAINS.some(
      (domain) => parsedUrl.host === domain || parsedUrl.host.endsWith(`.${domain}`)
    );

    if (!isDomainValid) {
      return false;
    }

    // Check if protocol is https
    if (parsedUrl.protocol !== 'https:') {
      return false;
    }

    // Check if path matches /(file|proto|design)/{id}
    const pathPattern = /^\/(file|proto|design)\/.+/;
    if (!pathPattern.test(parsedUrl.pathname)) {
      return false;
    }

    return true;
  } catch {
    // Invalid URL format
    return false;
  }
}

/**
 * Parse Figma URL to extract type and ID
 *
 * @param url - The Figma URL
 * @returns Object with type and id, or null if invalid
 */
export function parseFigmaUrl(url: string): {
  type: 'file' | 'proto' | 'design';
  id: string;
  name?: string;
} | null {
  if (!validateFigmaUrl(url)) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    const pathMatch = parsedUrl.pathname.match(/^\/(file|proto|design)\/([^/]+)(?:\/(.+))?$/);

    if (pathMatch) {
      const type = pathMatch[1] as 'file' | 'proto' | 'design';
      const id = pathMatch[2];
      const name = pathMatch[3] ? decodeURIComponent(pathMatch[3]) : undefined;

      return {
        type,
        id,
        name,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Validate an array of Figma URLs
 *
 * @param urls - Array of Figma URLs to validate
 * @returns Object with valid URLs and errors
 */
export function validateFigmaUrls(urls: string[]): {
  valid: string[];
  invalid: Array<{ url: string; error: string }>;
} {
  const result = {
    valid: [] as string[],
    invalid: [] as Array<{ url: string; error: string }>,
  };

  for (const url of urls) {
    if (validateFigmaUrl(url)) {
      result.valid.push(url);
    } else {
      result.invalid.push({
        url,
        error: 'Invalid Figma URL format. Expected: https://figma.com/(file|proto|design)/{id}',
      });
    }
  }

  return result;
}

/**
 * Generate Figma embed iframe code
 *
 * @param url - The Figma URL
 * @param options - Optional embed options
 * @returns HTML iframe embed code or null if invalid
 */
export function generateFigmaEmbed(
  url: string,
  options?: {
    width?: string | number;
    height?: string | number;
    allowFullscreen?: boolean;
  }
): string | null {
  if (!validateFigmaUrl(url)) {
    return null;
  }

  const parsed = parseFigmaUrl(url);
  if (!parsed) {
    return null;
  }

  // Only file and proto types support embedding
  if (parsed.type !== 'file' && parsed.type !== 'proto') {
    return null;
  }

  const width = options?.width || '100%';
  const height = options?.height || '450';
  const allowFullscreen = options?.allowFullscreen !== false;

  // Construct embed URL
  const embedUrl = `https://www.figma.com/embed?embed_host=odyssey&url=${encodeURIComponent(url)}`;

  return `<iframe
  style="border: 1px solid rgba(0, 0, 0, 0.1);"
  width="${width}"
  height="${height}"
  src="${embedUrl}"
  ${allowFullscreen ? 'allowfullscreen' : ''}
></iframe>`;
}

/**
 * Get Figma file type label
 *
 * @param url - The Figma URL
 * @returns Human-readable type label
 */
export function getFigmaTypeLabel(url: string): string {
  const parsed = parseFigmaUrl(url);
  if (!parsed) {
    return 'Unknown';
  }

  const labels: Record<string, string> = {
    file: 'Figma File',
    proto: 'Prototype',
    design: 'Design',
  };

  return labels[parsed.type] || 'Unknown';
}

/**
 * Extract Figma file name from URL if available
 *
 * @param url - The Figma URL
 * @returns File name or null
 */
export function getFigmaFileName(url: string): string | null {
  const parsed = parseFigmaUrl(url);
  return parsed?.name || null;
}

/**
 * Check if Figma URL is embeddable
 *
 * @param url - The Figma URL
 * @returns true if embeddable, false otherwise
 */
export function isFigmaUrlEmbeddable(url: string): boolean {
  const parsed = parseFigmaUrl(url);
  if (!parsed) {
    return false;
  }

  // Only file and proto types are embeddable
  return parsed.type === 'file' || parsed.type === 'proto';
}
