/**
 * CSV Export Utility
 *
 * Provides functions for exporting data to CSV format with proper escaping
 * and PII handling.
 */

/**
 * Escape a CSV value (handles commas, quotes, newlines)
 */
export function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV(data: Record<string, any>[]): string {
  if (data.length === 0) {
    return '';
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Build CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...data.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(',')
    ),
  ];

  return csvRows.join('\n');
}

/**
 * Export questionnaire responses to CSV
 */
export interface QuestionnaireResponse {
  id: string;
  submittedAt: Date | null;
  respondent: {
    id: string;
    employeeId: string;
    email: string;
    displayName: string;
    role: string;
    currentVillageId: string;
  };
  answers: any; // JSON
}

export interface Question {
  id: string;
  type: string;
  text?: string;
}

export function exportResponsesToCSV(
  responses: QuestionnaireResponse[],
  questions: Question[],
  includePII: boolean = false
): string {
  const data = responses.map((response) => {
    const answers =
      typeof response.answers === 'string'
        ? JSON.parse(response.answers)
        : response.answers;

    const row: Record<string, any> = {
      responseId: response.id,
      submittedAt: response.submittedAt?.toISOString() || '',
    };

    // Add PII if requested
    if (includePII) {
      row.userId = response.respondent.id;
      row.employeeId = response.respondent.employeeId;
      row.email = response.respondent.email;
      row.name = response.respondent.displayName;
    }

    // Always include non-PII demographics
    row.role = response.respondent.role;
    row.village = response.respondent.currentVillageId;

    // Add answers for each question
    questions.forEach((question, index) => {
      const answer = answers[question.id];
      const columnName = `Q${index + 1}_${question.type}`;

      // Handle different answer types
      if (Array.isArray(answer)) {
        row[columnName] = answer.join('; '); // Multi-select answers
      } else {
        row[columnName] = answer !== undefined ? answer : '';
      }
    });

    return row;
  });

  return arrayToCSV(data);
}

/**
 * Trigger browser download of CSV file (client-side only)
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export panel members to CSV
 */
export interface PanelMember {
  id: string;
  user: {
    id: string;
    employeeId: string;
    email: string;
    displayName: string;
    role: string;
    currentVillageId: string;
  };
  joinedAt: Date;
  active: boolean;
}

export function exportPanelMembersToCSV(
  members: PanelMember[],
  includePII: boolean = false
): string {
  const data = members.map((member) => {
    const row: Record<string, any> = {
      membershipId: member.id,
      joinedAt: member.joinedAt.toISOString(),
      active: member.active,
    };

    // Add PII if requested
    if (includePII) {
      row.userId = member.user.id;
      row.employeeId = member.user.employeeId;
      row.email = member.user.email;
      row.name = member.user.displayName;
    }

    // Always include non-PII demographics
    row.role = member.user.role;
    row.village = member.user.currentVillageId;

    return row;
  });

  return arrayToCSV(data);
}

/**
 * Export feedback items to CSV
 */
export interface FeedbackExport {
  id: string;
  title: string;
  body: string;
  state: string;
  productArea: string | null;
  villageId: string | null;
  visibility: string;
  source: string;
  createdAt: Date;
  author: {
    id: string;
    employeeId: string;
    email: string;
    displayName: string;
    role: string;
  };
  voteCount?: number;
  voteWeight?: number;
}

export function exportFeedbackToCSV(
  feedback: FeedbackExport[],
  includePII: boolean = false
): string {
  const data = feedback.map((item) => {
    const row: Record<string, any> = {
      feedbackId: item.id,
      title: item.title,
      body: item.body,
      state: item.state,
      productArea: item.productArea || '',
      villageId: item.villageId || '',
      visibility: item.visibility,
      source: item.source,
      createdAt: item.createdAt.toISOString(),
      voteCount: item.voteCount || 0,
      voteWeight: item.voteWeight || 0,
    };

    // Add PII if requested
    if (includePII) {
      row.authorId = item.author.id;
      row.authorEmployeeId = item.author.employeeId;
      row.authorEmail = item.author.email;
      row.authorName = item.author.displayName;
    }

    // Always include non-PII demographics
    row.authorRole = item.author.role;

    return row;
  });

  return arrayToCSV(data);
}
