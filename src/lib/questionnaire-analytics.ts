/**
 * Questionnaire Analytics Service
 *
 * Provides utility functions for computing questionnaire analytics including:
 * - NPS calculation
 * - Likert distribution analysis
 * - MCQ distribution
 * - Numeric statistics
 * - Segmentation by village, role, and panel
 *
 * Based on DSL spec in dsl/global.yaml (lines 153-215)
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface NPSResult {
  score: number; // -100 to 100
  promoters: number; // % of 9-10
  passives: number; // % of 7-8
  detractors: number; // % of 0-6
  totalResponses: number;
}

export interface Distribution {
  [key: string]: {
    count: number;
    percentage: number;
  };
}

export interface QuestionnaireAnalytics {
  overview: {
    totalResponses: number;
    completionRate: number;
    avgResponseTime?: number;
  };
  questions: QuestionAnalytics[];
}

export interface QuestionAnalytics {
  questionId: string;
  questionText: string;
  questionType: string;
  responseCount: number;
  // Type-specific analytics
  nps?: NPSResult;
  likertDistribution?: Distribution;
  mcqDistribution?: Distribution;
  textResponses?: string[];
  numericStats?: {
    mean: number;
    median: number;
    min: number;
    max: number;
  };
}

// ============================================================================
// NPS Calculation
// ============================================================================

/**
 * Compute Net Promoter Score (NPS)
 *
 * NPS = % Promoters - % Detractors
 * - Promoters: 9-10
 * - Passives: 7-8
 * - Detractors: 0-6
 *
 * @param scores - Array of NPS scores (0-10)
 * @returns NPSResult with score and breakdown
 */
export function computeNPS(scores: number[]): NPSResult {
  if (scores.length === 0) {
    return {
      score: 0,
      promoters: 0,
      passives: 0,
      detractors: 0,
      totalResponses: 0,
    };
  }

  const promoters = scores.filter(s => s >= 9).length;
  const passives = scores.filter(s => s >= 7 && s <= 8).length;
  const detractors = scores.filter(s => s <= 6).length;
  const total = scores.length;

  const promotersPct = (promoters / total) * 100;
  const passivesPct = (passives / total) * 100;
  const detractorsPct = (detractors / total) * 100;

  const npsScore = promotersPct - detractorsPct;

  return {
    score: Math.round(npsScore),
    promoters: Math.round(promotersPct),
    passives: Math.round(passivesPct),
    detractors: Math.round(detractorsPct),
    totalResponses: total,
  };
}

// ============================================================================
// Likert Distribution
// ============================================================================

/**
 * Compute Likert scale distribution
 *
 * Counts and calculates percentages for each scale value
 *
 * @param scores - Array of Likert scores
 * @returns Distribution object with counts and percentages
 */
export function computeLikertDistribution(scores: number[]): Distribution {
  const distribution: Distribution = {};

  scores.forEach(score => {
    const key = String(score);
    if (!distribution[key]) {
      distribution[key] = { count: 0, percentage: 0 };
    }
    const entry = distribution[key];
    if (entry) entry.count++;
  });

  const total = scores.length;
  Object.keys(distribution).forEach(key => {
    const entry = distribution[key];
    if (entry) {
      entry.percentage = Math.round((entry.count / total) * 100);
    }
  });

  return distribution;
}

// ============================================================================
// MCQ Distribution
// ============================================================================

/**
 * Compute Multiple Choice Question distribution
 *
 * Counts and calculates percentages for each option
 *
 * @param responses - Array of MCQ responses (strings)
 * @returns Distribution object with counts and percentages
 */
export function computeMCQDistribution(responses: string[]): Distribution {
  const distribution: Distribution = {};

  responses.forEach(response => {
    if (!distribution[response]) {
      distribution[response] = { count: 0, percentage: 0 };
    }
    const entry = distribution[response];
    if (entry) entry.count++;
  });

  const total = responses.length;
  Object.keys(distribution).forEach(key => {
    const entry = distribution[key];
    if (entry) {
      entry.percentage = Math.round((entry.count / total) * 100);
    }
  });

  return distribution;
}

// ============================================================================
// Numeric Statistics
// ============================================================================

/**
 * Compute numeric statistics (mean, median, min, max)
 *
 * @param values - Array of numeric values
 * @returns Statistics object
 */
export function computeNumericStats(values: number[]): {
  mean: number;
  median: number;
  min: number;
  max: number;
} {
  if (values.length === 0) {
    return { mean: 0, median: 0, min: 0, max: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;

  let median = 0;
  if (sorted.length % 2 === 0) {
    const mid1 = sorted[sorted.length / 2 - 1];
    const mid2 = sorted[sorted.length / 2];
    if (mid1 !== undefined && mid2 !== undefined) {
      median = (mid1 + mid2) / 2;
    }
  } else {
    const midValue = sorted[Math.floor(sorted.length / 2)];
    median = midValue !== undefined ? midValue : 0;
  }

  return {
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    min: sorted[0] || 0,
    max: sorted[sorted.length - 1] || 0,
  };
}

// ============================================================================
// Segmentation Functions
// ============================================================================

/**
 * Segment responses by village
 *
 * @param responses - Array of responses with userId
 * @param userVillageMap - Map of userId to villageId
 * @returns Segmented responses by village
 */
export function segmentByVillage<T extends { userId: string }>(
  responses: T[],
  userVillageMap: Record<string, string>
): Record<string, T[]> {
  const segments: Record<string, T[]> = {};

  responses.forEach(response => {
    const village = userVillageMap[response.userId] || 'unknown';
    if (!segments[village]) {
      segments[village] = [];
    }
    segments[village].push(response);
  });

  return segments;
}

/**
 * Segment responses by role
 *
 * @param responses - Array of responses with userId
 * @param userRoleMap - Map of userId to role
 * @returns Segmented responses by role
 */
export function segmentByRole<T extends { userId: string }>(
  responses: T[],
  userRoleMap: Record<string, string>
): Record<string, T[]> {
  const segments: Record<string, T[]> = {};

  responses.forEach(response => {
    const role = userRoleMap[response.userId] || 'unknown';
    if (!segments[role]) {
      segments[role] = [];
    }
    segments[role].push(response);
  });

  return segments;
}

/**
 * Segment responses by panel membership
 *
 * @param responses - Array of responses with userId
 * @param userPanelMap - Map of userId to array of panelIds
 * @returns Segmented responses by panel
 */
export function segmentByPanel<T extends { userId: string }>(
  responses: T[],
  userPanelMap: Record<string, string[]>
): Record<string, T[]> {
  const segments: Record<string, T[]> = {};

  responses.forEach(response => {
    const panels = userPanelMap[response.userId] || [];

    if (panels.length === 0) {
      if (!segments['no_panel']) {
        segments['no_panel'] = [];
      }
      segments['no_panel'].push(response);
    } else {
      panels.forEach(panelId => {
        if (!segments[panelId]) {
          segments[panelId] = [];
        }
        segments[panelId].push(response);
      });
    }
  });

  return segments;
}

// ============================================================================
// Aggregation Helpers
// ============================================================================

/**
 * Calculate completion rate
 *
 * @param totalStarted - Number of users who started
 * @param totalCompleted - Number of users who completed
 * @returns Completion rate as percentage (0-100)
 */
export function calculateCompletionRate(
  totalStarted: number,
  totalCompleted: number
): number {
  if (totalStarted === 0) return 0;
  return Math.round((totalCompleted / totalStarted) * 100);
}

/**
 * Calculate average response time
 *
 * @param responseTimes - Array of response times in milliseconds
 * @returns Average response time in seconds
 */
export function calculateAvgResponseTime(responseTimes: number[]): number {
  if (responseTimes.length === 0) return 0;
  const sum = responseTimes.reduce((acc, time) => acc + time, 0);
  const avgMs = sum / responseTimes.length;
  return Math.round((avgMs / 1000) * 100) / 100; // Convert to seconds
}

/**
 * Extract text responses for word frequency analysis
 *
 * @param textResponses - Array of text responses
 * @param minWordLength - Minimum word length to include (default: 4)
 * @returns Word frequency map
 */
export function extractWordFrequency(
  textResponses: string[],
  minWordLength: number = 4
): Record<string, number> {
  const wordFrequency: Record<string, number> = {};

  // Common stop words to exclude
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have',
    'was', 'were', 'been', 'not', 'but', 'they', 'you', 'are',
    'their', 'what', 'which', 'would', 'could', 'should', 'also'
  ]);

  textResponses.forEach(response => {
    const words = response
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length >= minWordLength && !stopWords.has(w));

    words.forEach(word => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
  });

  return wordFrequency;
}
