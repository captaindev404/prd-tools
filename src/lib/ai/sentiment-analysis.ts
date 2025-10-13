/**
 * AI-Powered Sentiment Analysis
 *
 * Analyzes sentiment of feedback to classify as positive, neutral, or negative.
 * Helps prioritize critical/negative feedback and track overall sentiment trends.
 */

import { callOpenAI, isAIEnabled } from './openai-client';

/**
 * Sentiment classification
 */
export enum Sentiment {
  Positive = 'positive',
  Neutral = 'neutral',
  Negative = 'negative',
}

/**
 * Result of sentiment analysis
 */
export interface SentimentResult {
  sentiment: Sentiment;
  score: number; // 0-1 (0 = very negative, 0.5 = neutral, 1 = very positive)
  confidence: number; // 0-1 (how confident the AI is)
  reasoning: string;
  aspects?: {
    // Sentiment breakdown by aspect
    usability?: number;
    satisfaction?: number;
    urgency?: number;
  };
}

/**
 * Analyze sentiment of feedback
 * @param title Feedback title
 * @param body Feedback body
 * @returns Sentiment analysis result
 */
export async function analyzeSentiment(
  title: string,
  body: string
): Promise<SentimentResult | null> {
  if (!isAIEnabled()) {
    console.warn('AI sentiment analysis disabled: AI_ENABLED not set or OPENAI_API_KEY missing');
    return null;
  }

  const systemPrompt = `You are an expert sentiment analyzer for customer feedback in hospitality software.

Your task:
1. Analyze the overall sentiment of the feedback (positive, neutral, or negative)
2. Assign a sentiment score from 0-1:
   - 0.0-0.3: Very negative (critical issues, anger, frustration)
   - 0.3-0.45: Negative (problems, complaints, disappointment)
   - 0.45-0.55: Neutral (factual, suggestions without emotion)
   - 0.55-0.7: Positive (satisfaction, praise, working well)
   - 0.7-1.0: Very positive (delight, exceptional experience)
3. Provide confidence in your assessment (0-1)
4. Explain your reasoning
5. Optionally break down sentiment by aspects (usability, satisfaction, urgency)

Guidelines:
- Consider tone, emotion, and language intensity
- Bug reports without emotional language are usually neutral
- Feature requests can be positive (wanting improvement) or negative (frustration)
- Consider urgency indicators: "critical", "urgent", "asap", "broken", "doesn't work"
- Constructive criticism with solutions is typically neutral-positive

Respond in JSON format:
{
  "sentiment": "positive|neutral|negative",
  "score": 0.75,
  "confidence": 0.9,
  "reasoning": "Brief explanation",
  "aspects": {
    "usability": 0.3,
    "satisfaction": 0.4,
    "urgency": 0.8
  }
}`;

  const userPrompt = `Analyze sentiment of this feedback:

Title: "${title}"

Body: "${body}"`;

  try {
    const response = await callOpenAI(systemPrompt, userPrompt, {
      temperature: 0.2,
      maxTokens: 400,
      responseFormat: 'json_object',
    });

    const result = JSON.parse(response);

    // Validate response
    if (!result.sentiment || typeof result.score !== 'number' || !result.reasoning) {
      console.error('Invalid sentiment analysis response:', result);
      return null;
    }

    // Validate sentiment
    const validSentiments = Object.values(Sentiment);
    if (!validSentiments.includes(result.sentiment)) {
      console.error('Invalid sentiment from AI:', result.sentiment);
      return null;
    }

    // Clamp score to 0-1
    const score = Math.max(0, Math.min(1, result.score));

    return {
      sentiment: result.sentiment as Sentiment,
      score,
      confidence: result.confidence || 0.8,
      reasoning: result.reasoning,
      aspects: result.aspects,
    };
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return null;
  }
}

/**
 * Get sentiment label from score
 * @param score Sentiment score (0-1)
 * @returns Sentiment classification
 */
export function getSentimentFromScore(score: number): Sentiment {
  if (score < 0.45) return Sentiment.Negative;
  if (score > 0.55) return Sentiment.Positive;
  return Sentiment.Neutral;
}

/**
 * Get sentiment color for UI
 * @param sentiment Sentiment classification
 * @returns Tailwind color class
 */
export function getSentimentColor(sentiment: Sentiment): string {
  switch (sentiment) {
    case Sentiment.Positive:
      return 'text-green-600';
    case Sentiment.Negative:
      return 'text-red-600';
    case Sentiment.Neutral:
      return 'text-gray-600';
  }
}

/**
 * Get sentiment icon
 * @param sentiment Sentiment classification
 * @returns Icon name (lucide-react)
 */
export function getSentimentIcon(sentiment: Sentiment): string {
  switch (sentiment) {
    case Sentiment.Positive:
      return 'ThumbsUp';
    case Sentiment.Negative:
      return 'ThumbsDown';
    case Sentiment.Neutral:
      return 'Minus';
  }
}

/**
 * Get urgency level from aspects
 * @param aspects Sentiment aspects
 * @returns Urgency level description
 */
export function getUrgencyLevel(aspects?: SentimentResult['aspects']): string {
  if (!aspects?.urgency) return 'Normal';
  if (aspects.urgency >= 0.8) return 'Critical';
  if (aspects.urgency >= 0.6) return 'High';
  if (aspects.urgency >= 0.4) return 'Medium';
  return 'Low';
}

/**
 * Batch analyze sentiment for multiple feedback items
 * @param feedbackItems Array of feedback to analyze
 * @returns Array of sentiment results
 */
export async function batchAnalyzeSentiment(
  feedbackItems: Array<{ id: string; title: string; body: string }>
): Promise<Array<{ id: string; result: SentimentResult | null }>> {
  const results = await Promise.allSettled(
    feedbackItems.map(async (item) => {
      const result = await analyzeSentiment(item.title, item.body);
      return { id: item.id, result };
    })
  );

  return results.map((r) => {
    if (r.status === 'fulfilled') {
      return r.value;
    }
    console.error('Batch sentiment analysis error:', r.reason);
    return { id: '', result: null };
  });
}

/**
 * Calculate aggregate sentiment statistics
 * @param sentiments Array of sentiment scores
 * @returns Aggregated statistics
 */
export function aggregateSentimentStats(sentiments: number[]): {
  average: number;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
} {
  if (sentiments.length === 0) {
    return { average: 0, positive: 0, neutral: 0, negative: 0, total: 0 };
  }

  const average = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;

  const positive = sentiments.filter((s) => s > 0.55).length;
  const neutral = sentiments.filter((s) => s >= 0.45 && s <= 0.55).length;
  const negative = sentiments.filter((s) => s < 0.45).length;

  return {
    average,
    positive,
    neutral,
    negative,
    total: sentiments.length,
  };
}
