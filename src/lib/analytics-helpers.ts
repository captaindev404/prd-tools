/**
 * Analytics helper functions for Gentil Feedback
 *
 * Provides utility functions for calculating metrics, formatting data,
 * and exporting analytics data.
 */

import { TimeRange, TrendData, ExportFormat } from '@/types/analytics';

// ========== TIME RANGE HELPERS ==========

/**
 * Converts a TimeRange to a Date object representing the start date
 * @param range - Time range (7d, 30d, 90d, 1y, all)
 * @returns Date object for the start of the range, or null for 'all'
 */
export function getStartDate(range: TimeRange): Date | null {
  const now = new Date();

  switch (range) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '1y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case 'all':
      return null;
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days
  }
}

/**
 * Gets the previous period's start and end dates for comparison
 * @param range - Time range
 * @returns Object with start and end dates for previous period
 */
export function getPreviousPeriod(range: TimeRange): { start: Date | null; end: Date | null } {
  const currentStart = getStartDate(range);
  if (!currentStart) {
    return { start: null, end: null };
  }

  const now = new Date();
  const periodLength = now.getTime() - currentStart.getTime();

  return {
    start: new Date(currentStart.getTime() - periodLength),
    end: currentStart,
  };
}

// ========== TREND CALCULATION ==========

/**
 * Calculates trend data comparing current and previous periods
 * @param current - Current period value
 * @param previous - Previous period value
 * @returns Trend data with change percentage and direction
 */
export function calculateTrend(current: number, previous: number): TrendData {
  const change = current - previous;
  const changePercentage = previous === 0 ? 100 : (change / previous) * 100;

  let direction: 'up' | 'down' | 'stable' = 'stable';
  if (Math.abs(changePercentage) < 1) {
    direction = 'stable';
  } else if (changePercentage > 0) {
    direction = 'up';
  } else {
    direction = 'down';
  }

  return {
    current,
    previous,
    change,
    changePercentage: Math.round(changePercentage * 10) / 10, // Round to 1 decimal
    direction,
  };
}

/**
 * Calculates simple percentage change
 * @param current - Current value
 * @param previous - Previous value
 * @returns Percentage change (rounded to 1 decimal)
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

// ========== METRIC FORMATTING ==========

/**
 * Formats large numbers with K, M, B suffixes
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string (e.g., "1.2K", "3.5M")
 */
export function formatMetric(value: number, decimals: number = 1): string {
  if (value === 0) return '0';

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1_000_000_000) {
    return `${sign}${(absValue / 1_000_000_000).toFixed(decimals)}B`;
  }
  if (absValue >= 1_000_000) {
    return `${sign}${(absValue / 1_000_000).toFixed(decimals)}M`;
  }
  if (absValue >= 1_000) {
    return `${sign}${(absValue / 1_000).toFixed(decimals)}K`;
  }

  return value.toString();
}

/**
 * Formats a percentage value
 * @param value - Percentage (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string (e.g., "42.5%")
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formats a decimal as a percentage
 * @param value - Decimal value (0-1)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string (e.g., "42.5%")
 */
export function formatRate(value: number, decimals: number = 1): string {
  return formatPercentage(value * 100, decimals);
}

// ========== RATE CALCULATIONS ==========

/**
 * Calculates response rate
 * @param responses - Number of responses
 * @param total - Total number of items sent
 * @returns Response rate as percentage (0-100)
 */
export function calculateResponseRate(responses: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((responses / total) * 1000) / 10;
}

/**
 * Calculates completion rate
 * @param completed - Number of completed items
 * @param total - Total number of items
 * @returns Completion rate as percentage (0-100)
 */
export function calculateCompletionRate(completed: number, total: number): number {
  return calculateResponseRate(completed, total);
}

/**
 * Calculates average value
 * @param values - Array of numbers
 * @returns Average value (rounded to 2 decimals)
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

// ========== NPS CALCULATION ==========

/**
 * Calculates NPS (Net Promoter Score) from responses
 * NPS scale: 0-6 = Detractors, 7-8 = Passives, 9-10 = Promoters
 * NPS = % Promoters - % Detractors
 *
 * @param responses - Array of NPS scores (0-10)
 * @returns NPS score (-100 to 100)
 */
export function calculateNPS(responses: number[]): number {
  if (responses.length === 0) return 0;

  const promoters = responses.filter((score) => score >= 9).length;
  const detractors = responses.filter((score) => score <= 6).length;
  const total = responses.length;

  const nps = ((promoters - detractors) / total) * 100;
  return Math.round(nps);
}

/**
 * Categorizes an NPS score
 * @param nps - NPS score (-100 to 100)
 * @returns Category: excellent, good, needs improvement, or poor
 */
export function categorizeNPS(nps: number): 'excellent' | 'good' | 'needs improvement' | 'poor' {
  if (nps >= 50) return 'excellent';
  if (nps >= 0) return 'good';
  if (nps >= -50) return 'needs improvement';
  return 'poor';
}

// ========== CSV EXPORT ==========

/**
 * Converts data to CSV format
 * @param data - Array of objects to convert
 * @param headers - Optional custom headers (defaults to object keys)
 * @returns CSV string
 */
export function generateCSV(data: Record<string, unknown>[], headers?: string[]): string {
  if (data.length === 0) return '';

  // Get headers from first object if not provided
  const firstItem = data[0];
  const csvHeaders = headers || (firstItem ? Object.keys(firstItem) : []);

  // Create header row
  const headerRow = csvHeaders.join(',');

  // Create data rows
  const dataRows = data.map((row) => {
    return csvHeaders
      .map((header) => {
        const value = row[header];
        // Handle strings with commas, quotes, or newlines
        if (typeof value === 'string') {
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
        }
        return value;
      })
      .join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Generates a filename for export with timestamp
 * @param prefix - Filename prefix
 * @param format - Export format (csv or json)
 * @returns Filename with timestamp
 */
export function generateExportFilename(prefix: string, format: ExportFormat): string {
  const timestamp = new Date().toISOString().split('T')[0] || ''; // YYYY-MM-DD
  return `${prefix}-${timestamp}.${format}`;
}

/**
 * Triggers a file download in the browser
 * @param content - File content
 * @param filename - Filename
 * @param mimeType - MIME type (default: text/csv)
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/csv'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports data as CSV
 * @param data - Data to export
 * @param filename - Filename
 */
export function exportAsCSV(data: Record<string, unknown>[], filename: string): void {
  const csv = generateCSV(data);
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Exports data as JSON
 * @param data - Data to export
 * @param filename - Filename
 */
export function exportAsJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, filename, 'application/json');
}

// ========== DATE FORMATTING ==========

/**
 * Formats a date for chart display
 * @param date - Date to format
 * @param range - Time range (affects format granularity)
 * @returns Formatted date string
 */
export function formatChartDate(date: Date, range: TimeRange): string {
  switch (range) {
    case '7d':
      // Show day of week for 7-day range
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    case '30d':
      // Show month and day for 30-day range
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case '90d':
    case '1y':
      // Show month and year for longer ranges
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    case 'all':
      // Show month and year for all-time
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    default:
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

/**
 * Groups dates by period (day, week, month)
 * @param dates - Array of dates
 * @param range - Time range
 * @returns Map of period key to dates
 */
export function groupDatesByPeriod(
  dates: Date[],
  range: TimeRange
): Map<string, Date[]> {
  const groups = new Map<string, Date[]>();

  dates.forEach((date) => {
    let key: string;

    switch (range) {
      case '7d':
      case '30d':
        // Group by day
        key = date.toISOString().split('T')[0] || '';
        break;
      case '90d':
        // Group by week
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0] || '';
        break;
      case '1y':
      case 'all':
        // Group by month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = date.toISOString().split('T')[0] || '';
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(date);
  });

  return groups;
}

// ========== COLOR UTILITIES ==========

/**
 * Gets color for chart based on category
 * @param category - Category name
 * @param index - Index for fallback color
 * @returns Hex color code
 */
export function getChartColor(category: string, index: number = 0): string {
  const colorMap: Record<string, string> = {
    // Product Areas
    Reservations: '#3b82f6', // blue
    CheckIn: '#10b981', // green
    Payments: '#f59e0b', // amber
    Housekeeping: '#8b5cf6', // purple
    Backoffice: '#ef4444', // red

    // Feedback States
    new: '#3b82f6', // blue
    triaged: '#f59e0b', // amber
    merged: '#8b5cf6', // purple
    in_roadmap: '#10b981', // green
    closed: '#6b7280', // gray

    // Sources
    app: '#3b82f6', // blue
    web: '#10b981', // green
    kiosk: '#f59e0b', // amber
    support: '#ef4444', // red
    import: '#8b5cf6', // purple

    // Feature Status
    idea: '#6b7280', // gray
    discovery: '#3b82f6', // blue
    shaping: '#8b5cf6', // purple
    in_progress: '#f59e0b', // amber
    released: '#10b981', // green
    generally_available: '#059669', // dark green
    deprecated: '#ef4444', // red

    // Roadmap Stages
    now: '#10b981', // green
    next: '#3b82f6', // blue
    later: '#8b5cf6', // purple
    under_consideration: '#6b7280', // gray
  };

  if (colorMap[category]) {
    return colorMap[category];
  }

  // Fallback to a color from a predefined palette
  const palette = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#84cc16',
  ];

  return palette[index % palette.length] || '#6b7280'; // Gray fallback
}
