/**
 * AI-Powered Feedback Categorization
 *
 * Automatically categorizes feedback into product areas using GPT-4.
 * Maps feedback to: Reservations, Check-in, Payments, Housekeeping, Backoffice
 */

import { ProductArea } from '@prisma/client';
import { callOpenAI, isAIEnabled } from './openai-client';

/**
 * Result of AI categorization
 */
export interface CategorizationResult {
  productArea: ProductArea;
  confidence: number; // 0-1 score
  reasoning: string;
  alternativeCategories?: Array<{
    productArea: ProductArea;
    confidence: number;
  }>;
}

/**
 * Product area descriptions for AI context
 */
const PRODUCT_AREA_DESCRIPTIONS = {
  Reservations: 'Booking accommodations, managing reservations, cancellations, modifications, availability, pricing, packages, and booking confirmation',
  CheckIn: 'Check-in and check-out processes, arrival experience, guest registration, room assignment, key cards, welcome experience, departure',
  Payments: 'Payment processing, billing, invoices, refunds, payment methods, pricing issues, charges, transaction problems, financial transactions',
  Housekeeping: 'Room cleaning, maintenance, amenities, room service, housekeeping requests, cleanliness issues, room condition, maintenance requests',
  Backoffice: 'Administrative functions, staff tools, internal systems, reporting, analytics, user management, system configuration, technical infrastructure',
};

/**
 * Example feedback for each category (few-shot learning)
 */
const CATEGORY_EXAMPLES = [
  {
    title: 'Cannot modify booking dates online',
    body: 'I tried to change my reservation dates but the website keeps showing an error. Had to call support.',
    category: 'Reservations',
  },
  {
    title: 'Long queue at check-in desk',
    body: 'Waited 45 minutes to check in. There should be a mobile check-in option.',
    category: 'CheckIn',
  },
  {
    title: 'Credit card payment failed',
    body: 'My payment was declined but money was deducted from my account. Need help resolving this.',
    category: 'Payments',
  },
  {
    title: 'Room not cleaned properly',
    body: 'Arrived to find room not cleaned. Towels were not replaced and bed was not made.',
    category: 'Housekeeping',
  },
  {
    title: 'Dashboard loading very slow',
    body: 'The admin dashboard takes forever to load. Reports take 30+ seconds to generate.',
    category: 'Backoffice',
  },
];

/**
 * Categorize feedback into product area using AI
 * @param title Feedback title
 * @param body Feedback body
 * @param confidenceThreshold Minimum confidence to return (default: 0.6)
 * @returns Categorization result or null if confidence too low
 */
export async function categorizeFeedback(
  title: string,
  body: string,
  confidenceThreshold = 0.6
): Promise<CategorizationResult | null> {
  if (!isAIEnabled()) {
    console.warn('AI categorization disabled: AI_ENABLED not set or OPENAI_API_KEY missing');
    return null;
  }

  // Build system prompt with product area descriptions and examples
  const systemPrompt = `You are an expert at categorizing customer feedback for a hospitality software platform.

Product Areas:
${Object.entries(PRODUCT_AREA_DESCRIPTIONS)
  .map(([area, desc]) => `- ${area}: ${desc}`)
  .join('\n')}

Examples:
${CATEGORY_EXAMPLES.map(
  (ex) => `Title: "${ex.title}"\nBody: "${ex.body}"\nCategory: ${ex.category}`
).join('\n\n')}

Your task:
1. Analyze the feedback title and body
2. Determine which product area it belongs to
3. Provide a confidence score (0-1)
4. Explain your reasoning
5. Optionally suggest alternative categories if confidence is not 100%

Respond in JSON format:
{
  "productArea": "Reservations|CheckIn|Payments|Housekeeping|Backoffice",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why this category was chosen",
  "alternativeCategories": [
    {"productArea": "...", "confidence": 0.4}
  ]
}`;

  const userPrompt = `Categorize this feedback:

Title: "${title}"

Body: "${body}"`;

  try {
    const response = await callOpenAI(systemPrompt, userPrompt, {
      temperature: 0.2, // Low temperature for consistent categorization
      maxTokens: 300,
      responseFormat: 'json_object',
    });

    const result = JSON.parse(response);

    // Validate response
    if (!result.productArea || !result.confidence || !result.reasoning) {
      console.error('Invalid AI response format:', result);
      return null;
    }

    // Validate product area
    const validAreas = Object.values(ProductArea);
    if (!validAreas.includes(result.productArea)) {
      console.error('Invalid product area from AI:', result.productArea);
      return null;
    }

    // Check confidence threshold
    if (result.confidence < confidenceThreshold) {
      console.log(`Low confidence (${result.confidence}) for categorization, skipping`);
      return null;
    }

    return {
      productArea: result.productArea as ProductArea,
      confidence: result.confidence,
      reasoning: result.reasoning,
      alternativeCategories: result.alternativeCategories || [],
    };
  } catch (error) {
    console.error('Error categorizing feedback:', error);
    return null;
  }
}

/**
 * Batch categorize multiple feedback items
 * @param feedbackItems Array of feedback to categorize
 * @returns Array of categorization results (null for failures)
 */
export async function batchCategorizeFeedback(
  feedbackItems: Array<{ id: string; title: string; body: string }>
): Promise<Array<{ id: string; result: CategorizationResult | null }>> {
  const results = await Promise.allSettled(
    feedbackItems.map(async (item) => {
      const result = await categorizeFeedback(item.title, item.body);
      return { id: item.id, result };
    })
  );

  return results.map((r) => {
    if (r.status === 'fulfilled') {
      return r.value;
    }
    console.error('Batch categorization error:', r.reason);
    return { id: '', result: null };
  });
}

/**
 * Get confidence level description
 * @param confidence Confidence score (0-1)
 * @returns Human-readable confidence level
 */
export function getConfidenceLevel(confidence: number): string {
  if (confidence >= 0.9) return 'Very High';
  if (confidence >= 0.75) return 'High';
  if (confidence >= 0.6) return 'Medium';
  if (confidence >= 0.4) return 'Low';
  return 'Very Low';
}
