/**
 * Jira REST API client for roadmap integrations
 * Based on DSL specification (integrations.trackers.jira)
 */

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: string;
    status: {
      name: string;
      statusCategory: {
        key: string;
      };
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    created: string;
    updated: string;
    priority?: {
      name: string;
    };
  };
}

export interface JiraSearchResult {
  issues: JiraIssue[];
  total: number;
}

/**
 * Jira API client
 * Requires environment variables:
 * - JIRA_HOST: Jira instance URL (e.g., "https://clubmed.atlassian.net")
 * - JIRA_EMAIL: Jira account email
 * - JIRA_API_TOKEN: Jira API token
 */
class JiraClient {
  private baseUrl: string;
  private email: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.JIRA_HOST || '';
    this.email = process.env.JIRA_EMAIL || '';
    this.token = process.env.JIRA_API_TOKEN || '';

    if (!this.baseUrl || !this.email || !this.token) {
      console.warn('Jira integration not configured. Set JIRA_HOST, JIRA_EMAIL, and JIRA_API_TOKEN.');
    }
  }

  /**
   * Check if Jira is configured
   */
  isConfigured(): boolean {
    return !!(this.baseUrl && this.email && this.token);
  }

  /**
   * Get authorization header
   */
  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.email}:${this.token}`).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Get issue by key
   */
  async getIssue(issueKey: string): Promise<JiraIssue | null> {
    if (!this.isConfigured()) {
      throw new Error('Jira integration not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/rest/api/3/issue/${issueKey}`, {
        method: 'GET',
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as JiraIssue;
    } catch (error) {
      console.error(`Error fetching Jira issue ${issueKey}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple issues by keys
   */
  async getIssues(issueKeys: string[]): Promise<JiraIssue[]> {
    if (!this.isConfigured()) {
      throw new Error('Jira integration not configured');
    }

    if (issueKeys.length === 0) {
      return [];
    }

    try {
      const jql = `key in (${issueKeys.join(',')})`;
      const response = await fetch(
        `${this.baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}`,
        {
          method: 'GET',
          headers: {
            Authorization: this.getAuthHeader(),
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
      }

      const data: JiraSearchResult = await response.json();
      return data.issues;
    } catch (error) {
      console.error('Error fetching Jira issues:', error);
      throw error;
    }
  }

  /**
   * Get issue status
   */
  async getIssueStatus(issueKey: string): Promise<string | null> {
    const issue = await this.getIssue(issueKey);
    return issue?.fields.status.name || null;
  }

  /**
   * Search issues by project and optional filters
   */
  async searchIssues(
    projectKeys: string[],
    filters?: {
      status?: string[];
      assignee?: string;
      limit?: number;
    }
  ): Promise<JiraSearchResult> {
    if (!this.isConfigured()) {
      throw new Error('Jira integration not configured');
    }

    try {
      let jql = `project in (${projectKeys.join(',')})`;

      if (filters?.status && filters.status.length > 0) {
        jql += ` AND status in (${filters.status.map((s) => `"${s}"`).join(',')})`;
      }

      if (filters?.assignee) {
        jql += ` AND assignee = "${filters.assignee}"`;
      }

      const maxResults = filters?.limit || 50;

      const response = await fetch(
        `${this.baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}`,
        {
          method: 'GET',
          headers: {
            Authorization: this.getAuthHeader(),
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
      }

      const data: JiraSearchResult = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching Jira issues:', error);
      throw error;
    }
  }

  /**
   * Create issue with feedback link
   */
  async createIssue(data: {
    projectKey: string;
    summary: string;
    description: string;
    issueType?: string;
    feedbackId?: string;
  }): Promise<JiraIssue> {
    if (!this.isConfigured()) {
      throw new Error('Jira integration not configured');
    }

    try {
      const issueData: any = {
        fields: {
          project: {
            key: data.projectKey,
          },
          summary: data.summary,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: data.description,
                  },
                ],
              },
            ],
          },
          issuetype: {
            name: data.issueType || 'Task',
          },
        },
      };

      // Add custom field for feedback ID if provided
      if (data.feedbackId && process.env.JIRA_FEEDBACK_FIELD_ID) {
        issueData.fields[process.env.JIRA_FEEDBACK_FIELD_ID] = data.feedbackId;
      }

      const response = await fetch(`${this.baseUrl}/rest/api/3/issue`, {
        method: 'POST',
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(issueData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Jira API error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      // Fetch the full issue details
      return await this.getIssue(result.key) as JiraIssue;
    } catch (error) {
      console.error('Error creating Jira issue:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const jiraClient = new JiraClient();

// Export helper functions
export async function getJiraTicketStatuses(ticketKeys: string[]): Promise<Record<string, string>> {
  if (!jiraClient.isConfigured() || ticketKeys.length === 0) {
    return {};
  }

  try {
    const issues = await jiraClient.getIssues(ticketKeys);
    const statuses: Record<string, string> = {};

    issues.forEach((issue) => {
      statuses[issue.key] = issue.fields.status.name;
    });

    return statuses;
  } catch (error) {
    console.error('Error fetching Jira ticket statuses:', error);
    return {};
  }
}

export async function validateJiraTickets(ticketKeys: string[]): Promise<{
  valid: string[];
  invalid: string[];
}> {
  if (!jiraClient.isConfigured() || ticketKeys.length === 0) {
    return { valid: [], invalid: ticketKeys };
  }

  try {
    const issues = await jiraClient.getIssues(ticketKeys);
    const validKeys = issues.map((issue) => issue.key);
    const invalidKeys = ticketKeys.filter((key) => !validKeys.includes(key));

    return { valid: validKeys, invalid: invalidKeys };
  } catch (error) {
    console.error('Error validating Jira tickets:', error);
    return { valid: [], invalid: ticketKeys };
  }
}
