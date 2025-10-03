/**
 * Test script for feedback utilities
 * Run with: tsx scripts/test-utilities.ts
 */

import { redactPII, detectPII, containsPII } from '../src/lib/pii-redact';
import { getSimilarityScore, getLevenshteinSimilarity } from '../src/lib/fuzzy-match';

console.log('========================================');
console.log('Testing PII Redaction Utility');
console.log('========================================\n');

// Test cases for PII redaction
const piiTestCases = [
  {
    name: 'Email address',
    input: 'Contact me at john.doe@clubmed.com for details',
    expected: 'Contact me at ***.com for details',
  },
  {
    name: 'Phone number',
    input: 'Call me at +33 1 23 45 67 89 or +1-555-123-4567',
    expected: 'Call me at ***67 89 or ***-4567',
  },
  {
    name: 'Room number',
    input: 'I stayed in room 1234 and room #5678',
    expected: 'I stayed in ***1234 and ***5678',
  },
  {
    name: 'Reservation ID',
    input: 'My reservation RES#ABC123456 was cancelled',
    expected: 'My ***3456 was cancelled',
  },
  {
    name: 'Multiple PII types',
    input: 'Room 401, reservation RESV#XYZ789, contact: user@email.com, phone: 555-1234',
    expected: 'Multiple items redacted',
  },
  {
    name: 'No PII',
    input: 'The check-in process was slow and confusing',
    expected: 'The check-in process was slow and confusing',
  },
];

piiTestCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`Input:  ${testCase.input}`);

  const redacted = redactPII(testCase.input);
  console.log(`Output: ${redacted}`);

  const detected = detectPII(testCase.input);
  const hasPII = containsPII(testCase.input);
  console.log(`Detected PII types: ${detected.length > 0 ? detected.join(', ') : 'none'}`);
  console.log(`Contains PII: ${hasPII}`);
  console.log();
});

console.log('========================================');
console.log('Testing Fuzzy Match Utility');
console.log('========================================\n');

// Test cases for fuzzy matching
const fuzzyTestCases = [
  {
    str1: 'Check-in process is too slow',
    str2: 'Check in process is too slow',
    description: 'Minor punctuation difference',
  },
  {
    str1: 'Mobile app crashes on payment',
    str2: 'Mobile app crash during payment',
    description: 'Similar but slightly different wording',
  },
  {
    str1: 'Cannot find reservation',
    str2: 'Can not find my reservation',
    description: 'Very similar meaning',
  },
  {
    str1: 'WiFi not working in room',
    str2: 'Internet connection broken',
    description: 'Different wording, same issue',
  },
  {
    str1: 'Check-in kiosk is broken',
    str2: 'Payment system does not work',
    description: 'Completely different issues',
  },
  {
    str1: 'The quick brown fox',
    str2: 'The quick brown fox',
    description: 'Identical strings',
  },
];

console.log('Testing Dice Coefficient (default algorithm):\n');
fuzzyTestCases.forEach((testCase, index) => {
  const score = getSimilarityScore(testCase.str1, testCase.str2);
  const isAboveThreshold = score >= 0.86;

  console.log(`Test ${index + 1}: ${testCase.description}`);
  console.log(`String 1: ${testCase.str1}`);
  console.log(`String 2: ${testCase.str2}`);
  console.log(`Similarity: ${(score * 100).toFixed(2)}% ${isAboveThreshold ? '✓ DUPLICATE' : '✗ Not duplicate'}`);
  console.log();
});

console.log('\nTesting Levenshtein Distance (alternative):\n');
fuzzyTestCases.forEach((testCase, index) => {
  const score = getLevenshteinSimilarity(testCase.str1, testCase.str2);
  const isAboveThreshold = score >= 0.86;

  console.log(`Test ${index + 1}: ${testCase.description}`);
  console.log(`Similarity: ${(score * 100).toFixed(2)}% ${isAboveThreshold ? '✓' : '✗'}`);
});

console.log('\n========================================');
console.log('All utility tests completed!');
console.log('========================================');
