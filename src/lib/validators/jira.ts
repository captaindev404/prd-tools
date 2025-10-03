/**
 * Jira link validation utilities
 *
 * Validates Jira URLs for ODYS and PMS projects
 */

const ALLOWED_PROJECT_KEYS = ['ODYS', 'PMS'];
const JIRA_BASE_URL = process.env.JIRA_BASE_URL || 'https://jira.company.com';

/**
 * Validate Jira URL format
 *
 * Pattern: https://jira.company.com/browse/(ODYS|PMS)-\d+
 *
 * @param url - The Jira URL to validate
 * @returns true if valid, false otherwise
 */
export function validateJiraUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsedUrl = new URL(url);

    // Check if it's from the correct domain
    const expectedHost = new URL(JIRA_BASE_URL).host;
    if (parsedUrl.host !== expectedHost) {
      return false;
    }

    // Check if path matches /browse/{PROJECT_KEY}-{NUMBER}
    const pathPattern = /^\/browse\/(ODYS|PMS)-\d+$/;
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
 * Extract project key and issue number from Jira URL
 *
 * @param url - The Jira URL
 * @returns Object with projectKey and issueNumber, or null if invalid
 */
export function parseJiraUrl(url: string): { projectKey: string; issueNumber: string; issueKey: string } | null {
  if (!validateJiraUrl(url)) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    const match = parsedUrl.pathname.match(/\/browse\/(ODYS|PMS)-(\d+)$/);

    if (match) {
      const projectKey = match[1];
      const issueNumber = match[2];
      const issueKey = `${projectKey}-${issueNumber}`;

      return {
        projectKey,
        issueNumber,
        issueKey,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Validate an array of Jira URLs
 *
 * @param urls - Array of Jira URLs to validate
 * @returns Object with valid URLs and errors
 */
export function validateJiraUrls(urls: string[]): {
  valid: string[];
  invalid: Array<{ url: string; error: string }>;
} {
  const result = {
    valid: [] as string[],
    invalid: [] as Array<{ url: string; error: string }>,
  };

  for (const url of urls) {
    if (validateJiraUrl(url)) {
      result.valid.push(url);
    } else {
      result.invalid.push({
        url,
        error: `Invalid Jira URL format. Expected: ${JIRA_BASE_URL}/browse/(ODYS|PMS)-{number}`,
      });
    }
  }

  return result;
}

/**
 * Fetch Jira issue details (optional integration)
 *
 * Requires JIRA_API_TOKEN and JIRA_API_USER environment variables
 *
 * @param url - The Jira URL
 * @returns Promise with issue details or null
 */
export async function fetchJiraIssue(url: string): Promise<{
  title: string;
  status: string;
  key: string;
} | null> {
  const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
  const JIRA_API_USER = process.env.JIRA_API_USER;

  if (!JIRA_API_TOKEN || !JIRA_API_USER) {
    console.warn('⚠️  Jira API credentials not configured. Set JIRA_API_TOKEN and JIRA_API_USER.');
    return null;
  }

  const parsed = parseJiraUrl(url);
  if (!parsed) {
    return null;
  }

  try {
    const apiUrl = `${JIRA_BASE_URL}/rest/api/2/issue/${parsed.issueKey}`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${JIRA_API_USER}:${JIRA_API_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Jira API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    return {
      title: data.fields?.summary || '',
      status: data.fields?.status?.name || '',
      key: data.key,
    };
  } catch (error) {
    console.error('Error fetching Jira issue:', error);
    return null;
  }
}

/**
 * Generate Jira URL from issue key
 *
 * @param issueKey - The issue key (e.g., "ODYS-123")
 * @returns Full Jira URL
 */
export function generateJiraUrl(issueKey: string): string {
  return `${JIRA_BASE_URL}/browse/${issueKey}`;
}
