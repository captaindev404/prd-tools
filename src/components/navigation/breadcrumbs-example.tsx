/**
 * Example usage of the Breadcrumbs component
 *
 * This file demonstrates how to integrate breadcrumbs into different pages.
 * DO NOT import this file in production code - it's for documentation only.
 */

import { Breadcrumbs } from './breadcrumbs';

// Example 1: Simple breadcrumb on a detail page
export function FeedbackDetailExample() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumbs
        items={[
          { title: 'Feedback', href: '/feedback' },
          { title: 'Feature Request' }, // Current page (no href)
        ]}
      />
      {/* Rest of page content */}
    </div>
  );
}

// Example 2: Nested navigation with multiple levels
export function DeepNavigationExample() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumbs
        items={[
          { title: 'Research', href: '/research' },
          { title: 'Panels', href: '/research/panels' },
          { title: 'Beta Testers Panel', href: '/research/panels/pan_123' },
          { title: 'Edit' }, // Current page
        ]}
      />
      {/* Rest of page content */}
    </div>
  );
}

// Example 3: Breadcrumb for edit pages
export function EditPageExample() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumbs
        items={[
          { title: 'Features', href: '/features' },
          { title: 'Check-in System', href: '/features/ft_456' },
          { title: 'Edit' }, // Current page
        ]}
      />
      {/* Rest of page content */}
    </div>
  );
}

// Example 4: Breadcrumb on questionnaire analytics page
export function AnalyticsPageExample() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumbs
        items={[
          { title: 'Research', href: '/research' },
          { title: 'Questionnaires', href: '/research/questionnaires' },
          { title: 'User Satisfaction Survey', href: '/research/questionnaires/qnn_789' },
          { title: 'Analytics' }, // Current page
        ]}
      />
      {/* Rest of page content */}
    </div>
  );
}

// Example 5: Minimal breadcrumb (one level deep)
export function MinimalExample() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumbs
        items={[
          { title: 'Settings' }, // Current page
        ]}
      />
      {/* Rest of page content */}
    </div>
  );
}

// Example 6: Breadcrumb with dynamic content (using Server Component pattern)
export async function DynamicBreadcrumbExample({ feedbackId }: { feedbackId: string }) {
  // In a real server component, you would fetch the feedback title
  const feedbackTitle = 'Add passport scanning feature';

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumbs
        items={[
          { title: 'Feedback', href: '/feedback' },
          { title: feedbackTitle }, // Dynamic current page title
        ]}
      />
      {/* Rest of page content */}
    </div>
  );
}

/**
 * Mobile Responsiveness Notes:
 * - The breadcrumbs automatically wrap on mobile devices
 * - Text size (text-sm) is readable on all screen sizes
 * - Icons scale appropriately with the text
 * - Spacing is consistent across breakpoints
 *
 * Accessibility Features:
 * - Semantic <nav> element with aria-label="Breadcrumb"
 * - Home icon has aria-label="Home" for screen readers
 * - Current page has aria-current="page" attribute
 * - ChevronRight separators have aria-hidden="true"
 * - Keyboard navigation works via Tab/Shift+Tab
 * - Focus indicators visible on all interactive elements
 *
 * Design Tokens:
 * - Text: text-sm for consistent sizing
 * - Colors: text-muted-foreground for links, text-foreground for current
 * - Hover: hover:text-foreground with smooth transition
 * - Current: font-medium to emphasize
 * - Spacing: space-x-1 for consistent gaps
 * - Icons: h-4 w-4 for consistent sizing
 */
