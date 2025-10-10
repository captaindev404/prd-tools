/**
 * Feature Flag System
 *
 * Provides a centralized feature flag system to enable/disable features
 * across the application. Feature flags are controlled via environment variables.
 *
 * Usage:
 * - Set environment variables in .env file
 * - Check flag status using isFeatureEnabled()
 * - Wrap components/routes with feature flag checks
 *
 * @example
 * if (isFeatureEnabled('ENABLE_ATTACHMENTS')) {
 *   // Show file upload component
 * }
 */

/**
 * Feature flags configuration
 * All flags default to false for safety
 */
export const FEATURE_FLAGS = {
  /**
   * Enable file attachments on feedback
   * When enabled:
   * - Users can upload files (images, documents) to feedback
   * - Upload API endpoints are active
   * - File cleanup jobs run
   *
   * When disabled:
   * - File upload UI is hidden
   * - Upload API returns 403
   * - Existing attachments remain visible but can't be added/removed
   */
  ENABLE_ATTACHMENTS: process.env.ENABLE_ATTACHMENTS === 'true',

  /**
   * Enable automatic image compression
   * When enabled:
   * - Uploaded images are compressed to reduce size
   * - JPEG quality: 85%
   * - PNG conversion to WebP
   * - Max dimension: 2000x2000px
   *
   * When disabled:
   * - Images uploaded as-is (still validated for size/type)
   */
  ENABLE_IMAGE_COMPRESSION: process.env.ENABLE_IMAGE_COMPRESSION === 'true',

  /**
   * Enable virus scanning for uploaded files
   * When enabled:
   * - Files are scanned with ClamAV or similar
   * - Infected files are rejected
   * - Scan results logged to audit
   *
   * When disabled:
   * - Files uploaded without virus scan (still validated for type/size)
   *
   * Note: Requires virus scanner service configured
   */
  ENABLE_VIRUS_SCAN: process.env.ENABLE_VIRUS_SCAN === 'true',

  /**
   * Enable duplicate detection for feedback
   * When enabled:
   * - Uses fuzzy matching to detect similar feedback
   * - Shows duplicate suggestions during submission
   * - Threshold: 0.86 (per DSL spec)
   *
   * When disabled:
   * - No duplicate detection
   * - Users can submit similar feedback
   */
  ENABLE_DUPLICATE_DETECTION: process.env.ENABLE_DUPLICATE_DETECTION === 'true',

  /**
   * Enable email notifications
   * When enabled:
   * - Users receive email for roadmap updates, questionnaires, etc.
   * - Requires SendGrid configured
   *
   * When disabled:
   * - In-app notifications only
   */
  ENABLE_EMAIL_NOTIFICATIONS: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',

  /**
   * Enable research panels
   * When enabled:
   * - Researchers can create panels
   * - Users can join panels
   * - Panel management UI active
   *
   * When disabled:
   * - Research features hidden
   */
  ENABLE_RESEARCH_PANELS: process.env.ENABLE_RESEARCH_PANELS === 'true',

  /**
   * Enable moderation queue
   * When enabled:
   * - Auto-moderation checks feedback for toxicity/spam/PII
   * - Moderators can review flagged content
   * - PII redaction active
   *
   * When disabled:
   * - All feedback auto-approved
   * - No moderation UI
   */
  ENABLE_MODERATION: process.env.ENABLE_MODERATION === 'true',

  /**
   * Enable analytics tracking
   * When enabled:
   * - User actions tracked to analytics
   * - Requires user consent
   *
   * When disabled:
   * - No analytics tracking
   */
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
} as const;

/**
 * Feature flag keys type
 */
export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

/**
 * Check if a feature is enabled
 *
 * @param flag - Feature flag key
 * @returns True if feature is enabled
 *
 * @example
 * if (isFeatureEnabled('ENABLE_ATTACHMENTS')) {
 *   return <FileUploadComponent />;
 * }
 */
export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  return FEATURE_FLAGS[flag] ?? false;
}

/**
 * Get all enabled features
 *
 * @returns Array of enabled feature flag keys
 */
export function getEnabledFeatures(): FeatureFlagKey[] {
  return (Object.keys(FEATURE_FLAGS) as FeatureFlagKey[]).filter(
    key => FEATURE_FLAGS[key] === true
  );
}

/**
 * Get all disabled features
 *
 * @returns Array of disabled feature flag keys
 */
export function getDisabledFeatures(): FeatureFlagKey[] {
  return (Object.keys(FEATURE_FLAGS) as FeatureFlagKey[]).filter(
    key => FEATURE_FLAGS[key] === false
  );
}

/**
 * Get feature flag status summary
 *
 * @returns Object with feature flag status
 */
export function getFeatureFlagSummary(): {
  total: number;
  enabled: number;
  disabled: number;
  flags: Record<FeatureFlagKey, boolean>;
} {
  const enabled = getEnabledFeatures();
  const disabled = getDisabledFeatures();

  return {
    total: Object.keys(FEATURE_FLAGS).length,
    enabled: enabled.length,
    disabled: disabled.length,
    flags: { ...FEATURE_FLAGS },
  };
}

/**
 * Feature flag descriptions for UI/documentation
 */
export const FEATURE_FLAG_DESCRIPTIONS: Record<FeatureFlagKey, string> = {
  ENABLE_ATTACHMENTS: 'Allow users to attach files to feedback',
  ENABLE_IMAGE_COMPRESSION: 'Automatically compress uploaded images',
  ENABLE_VIRUS_SCAN: 'Scan uploaded files for viruses',
  ENABLE_DUPLICATE_DETECTION: 'Detect and suggest duplicate feedback',
  ENABLE_EMAIL_NOTIFICATIONS: 'Send email notifications to users',
  ENABLE_RESEARCH_PANELS: 'Enable research panels and user testing',
  ENABLE_MODERATION: 'Enable content moderation and PII redaction',
  ENABLE_ANALYTICS: 'Track user actions for analytics',
};

/**
 * Require a feature flag to be enabled, throw error if not
 *
 * @param flag - Feature flag key
 * @param errorMessage - Optional custom error message
 * @throws Error if feature is disabled
 *
 * @example
 * requireFeature('ENABLE_ATTACHMENTS', 'File uploads are currently disabled');
 */
export function requireFeature(
  flag: FeatureFlagKey,
  errorMessage?: string
): void {
  if (!isFeatureEnabled(flag)) {
    throw new Error(
      errorMessage || `Feature ${flag} is disabled`
    );
  }
}

/**
 * Higher-order function to wrap API routes with feature flag check
 *
 * @param flag - Feature flag key
 * @param handler - API route handler
 * @returns Wrapped handler that checks feature flag
 *
 * @example
 * export const POST = withFeatureFlag(
 *   'ENABLE_ATTACHMENTS',
 *   async (request) => { ... }
 * );
 */
export function withFeatureFlag<T extends (...args: any[]) => any>(
  flag: FeatureFlagKey,
  handler: T
): T {
  return (async (...args: any[]) => {
    if (!isFeatureEnabled(flag)) {
      const Response = (await import('next/server')).NextResponse;
      return Response.json(
        {
          error: 'Feature disabled',
          message: `The feature ${flag} is currently disabled`,
        },
        { status: 403 }
      );
    }
    return handler(...args);
  }) as T;
}

/**
 * Log feature flag status on startup (useful for debugging)
 */
export function logFeatureFlagStatus(): void {
  const summary = getFeatureFlagSummary();

  console.log('\n========== Feature Flags ==========');
  console.log(`Total: ${summary.total} (${summary.enabled} enabled, ${summary.disabled} disabled)`);
  console.log('\nEnabled features:');

  if (summary.enabled === 0) {
    console.log('  (none)');
  } else {
    getEnabledFeatures().forEach(flag => {
      console.log(`  ✓ ${flag}: ${FEATURE_FLAG_DESCRIPTIONS[flag]}`);
    });
  }

  if (summary.disabled > 0) {
    console.log('\nDisabled features:');
    getDisabledFeatures().forEach(flag => {
      console.log(`  ✗ ${flag}: ${FEATURE_FLAG_DESCRIPTIONS[flag]}`);
    });
  }

  console.log('===================================\n');
}

// Log feature flags on module load in development
if (process.env.NODE_ENV === 'development') {
  logFeatureFlagStatus();
}
