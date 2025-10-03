'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * SkipNav Component
 *
 * Provides a skip navigation link for keyboard and screen reader users
 * to bypass the sidebar navigation and jump directly to main content.
 *
 * WCAG 2.1 Success Criterion 2.4.1: Bypass Blocks (Level A)
 *
 * Features:
 * - Hidden until focused via keyboard (Tab key)
 * - High contrast visible focus indicator
 * - Smooth scroll to main content
 * - Positioned at top of document for first Tab stop
 *
 * @example
 * ```tsx
 * <SkipNav />
 * <nav>...</nav>
 * <main id="main-content">...</main>
 * ```
 */
export function SkipNav() {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus({ preventScroll: false });
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      className={cn(
        // Visually hidden by default
        'sr-only',
        // Visible when focused (keyboard navigation)
        'focus:not-sr-only',
        'focus:fixed focus:top-4 focus:left-4 focus:z-50',
        // Styling for visible state
        'focus:inline-block focus:rounded-md focus:bg-primary focus:px-4 focus:py-2',
        'focus:text-primary-foreground focus:font-medium focus:text-sm',
        // Enhanced focus ring for accessibility
        'focus:ring-4 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
        // Smooth transition
        'transition-all duration-150',
        // Ensure it appears above all content
        'focus:shadow-lg'
      )}
    >
      Skip to main content
    </a>
  );
}
