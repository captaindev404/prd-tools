#!/usr/bin/env tsx

/**
 * Translation Validation Script
 *
 * Validates translation completeness and generates a report
 *
 * Usage:
 *   npm run validate-translations
 *   or
 *   npx tsx scripts/validate-translations.ts
 */

import { validateTranslations, generateMissingTranslationsReport } from '../src/lib/i18n/validate-translations';

function main() {
  console.log('🌍 Validating translations...\n');

  const validation = validateTranslations();

  console.log('📊 Summary:');
  console.log(`  Total keys in English: ${validation.englishKeys}`);
  console.log(`  Total keys in French: ${validation.frenchKeys}`);
  console.log(`  Coverage: ${((validation.frenchKeys / validation.englishKeys) * 100).toFixed(2)}%`);
  console.log(`  Complete: ${validation.isComplete ? 'Yes ✅' : 'No ❌'}\n`);

  if (validation.missingInFrench.length > 0) {
    console.log(`❌ Missing in French (${validation.missingInFrench.length}):`);
    validation.missingInFrench.slice(0, 10).forEach((key) => {
      console.log(`  - ${key}`);
    });
    if (validation.missingInFrench.length > 10) {
      console.log(`  ... and ${validation.missingInFrench.length - 10} more`);
    }
    console.log('');
  }

  if (validation.extraInFrench.length > 0) {
    console.log(`⚠️  Extra in French (${validation.extraInFrench.length}):`);
    validation.extraInFrench.slice(0, 10).forEach((key) => {
      console.log(`  - ${key}`);
    });
    if (validation.extraInFrench.length > 10) {
      console.log(`  ... and ${validation.extraInFrench.length - 10} more`);
    }
    console.log('');
  }

  if (validation.isComplete) {
    console.log('✅ All translations are complete!');
  } else {
    console.log('❌ Translations are incomplete. Run with --report flag for detailed report.');
  }

  // Generate detailed report if --report flag is provided
  if (process.argv.includes('--report')) {
    const report = generateMissingTranslationsReport();
    console.log('\n' + report);
  }

  // Exit with error code if translations are incomplete
  process.exit(validation.isComplete ? 0 : 1);
}

main();
