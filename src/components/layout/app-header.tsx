'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { PanelLeft } from 'lucide-react';
import { SessionUser } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { UserNav } from '@/components/navigation/user-nav';
import { NotificationBell } from '@/components/notifications/notification-bell';

/**
 * Breadcrumb Item Type
 */
interface BreadcrumbItem {
  title: string;
  href?: string;
}

/**
 * Route to Breadcrumb mapping
 * Maps pathname patterns to breadcrumb configurations
 */
const routeBreadcrumbs: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [],
  '/feedback': [{ title: 'Feedback' }],
  '/feedback/new': [{ title: 'Feedback', href: '/feedback' }, { title: 'New Feedback' }],
  '/features': [{ title: 'Features' }],
  '/features/new': [{ title: 'Features', href: '/features' }, { title: 'New Feature' }],
  '/roadmap': [{ title: 'Roadmap' }],
  '/roadmap/new': [{ title: 'Roadmap', href: '/roadmap' }, { title: 'New Item' }],
  '/research': [{ title: 'Research' }],
  '/research/sessions': [{ title: 'Research', href: '/research' }, { title: 'Sessions' }],
  '/research/sessions/new': [
    { title: 'Research', href: '/research' },
    { title: 'Sessions', href: '/research/sessions' },
    { title: 'New Session' },
  ],
  '/research/panels': [{ title: 'Research', href: '/research' }, { title: 'Panels' }],
  '/research/panels/new': [
    { title: 'Research', href: '/research' },
    { title: 'Panels', href: '/research/panels' },
    { title: 'New Panel' },
  ],
  '/research/questionnaires': [{ title: 'Research', href: '/research' }, { title: 'Questionnaires' }],
  '/research/questionnaires/new': [
    { title: 'Research', href: '/research' },
    { title: 'Questionnaires', href: '/research/questionnaires' },
    { title: 'New Questionnaire' },
  ],
  '/analytics': [{ title: 'Analytics' }],
  '/moderation': [{ title: 'Moderation' }],
  '/admin': [{ title: 'Admin' }],
  '/admin/users': [{ title: 'Admin', href: '/admin' }, { title: 'Users' }],
  '/admin/villages': [{ title: 'Admin', href: '/admin' }, { title: 'Villages' }],
  '/settings': [{ title: 'Settings' }],
};

/**
 * Props for AppHeader
 */
interface AppHeaderProps {
  user: SessionUser;
}

/**
 * AppHeader Component
 *
 * Main header for the authenticated application with sidebar integration.
 * Features:
 * - Sidebar toggle button
 * - Dynamic breadcrumb navigation
 * - Notification bell with unread count
 * - User avatar dropdown menu
 * - Responsive design
 *
 * @param user - Current authenticated user
 */
export function AppHeader({ user }: AppHeaderProps) {
  const pathname = usePathname();

  /**
   * Get breadcrumbs for current route
   * Supports both exact matches and dynamic routes (e.g., /feedback/[id])
   */
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    // Try exact match first
    if (routeBreadcrumbs[pathname]) {
      return routeBreadcrumbs[pathname];
    }

    // Handle dynamic routes by matching pattern
    const pathSegments = pathname.split('/').filter(Boolean);

    // Match feedback detail pages
    if (pathSegments[0] === 'feedback' && pathSegments.length === 2) {
      return [
        { title: 'Feedback', href: '/feedback' },
        { title: 'Feedback Detail' },
      ];
    }

    // Match feedback edit pages
    if (pathSegments[0] === 'feedback' && pathSegments[2] === 'edit') {
      return [
        { title: 'Feedback', href: '/feedback' },
        { title: 'Edit Feedback' },
      ];
    }

    // Match feature detail pages
    if (pathSegments[0] === 'features' && pathSegments.length === 2) {
      return [
        { title: 'Features', href: '/features' },
        { title: 'Feature Detail' },
      ];
    }

    // Match feature edit pages
    if (pathSegments[0] === 'features' && pathSegments[2] === 'edit') {
      return [
        { title: 'Features', href: '/features' },
        { title: 'Edit Feature' },
      ];
    }

    // Match roadmap detail pages
    if (pathSegments[0] === 'roadmap' && pathSegments.length === 2) {
      return [
        { title: 'Roadmap', href: '/roadmap' },
        { title: 'Roadmap Detail' },
      ];
    }

    // Match roadmap edit pages
    if (pathSegments[0] === 'roadmap' && pathSegments[2] === 'edit') {
      return [
        { title: 'Roadmap', href: '/roadmap' },
        { title: 'Edit Roadmap Item' },
      ];
    }

    // Match research session detail/edit pages
    if (pathSegments[0] === 'research' && pathSegments[1] === 'sessions') {
      if (pathSegments.length === 3 && pathSegments[2] !== 'new') {
        return [
          { title: 'Research', href: '/research' },
          { title: 'Sessions', href: '/research/sessions' },
          { title: 'Session Detail' },
        ];
      }
      if (pathSegments[3] === 'edit') {
        return [
          { title: 'Research', href: '/research' },
          { title: 'Sessions', href: '/research/sessions' },
          { title: 'Edit Session' },
        ];
      }
    }

    // Match research panel detail/edit pages
    if (pathSegments[0] === 'research' && pathSegments[1] === 'panels') {
      if (pathSegments.length === 3 && pathSegments[2] !== 'new') {
        return [
          { title: 'Research', href: '/research' },
          { title: 'Panels', href: '/research/panels' },
          { title: 'Panel Detail' },
        ];
      }
      if (pathSegments[3] === 'edit') {
        return [
          { title: 'Research', href: '/research' },
          { title: 'Panels', href: '/research/panels' },
          { title: 'Edit Panel' },
        ];
      }
    }

    // Match research questionnaire pages
    if (pathSegments[0] === 'research' && pathSegments[1] === 'questionnaires') {
      if (pathSegments.length === 3 && pathSegments[2] !== 'new') {
        return [
          { title: 'Research', href: '/research' },
          { title: 'Questionnaires', href: '/research/questionnaires' },
          { title: 'Questionnaire Detail' },
        ];
      }
      if (pathSegments[3] === 'edit') {
        return [
          { title: 'Research', href: '/research' },
          { title: 'Questionnaires', href: '/research/questionnaires' },
          { title: 'Edit Questionnaire' },
        ];
      }
      if (pathSegments[3] === 'analytics') {
        return [
          { title: 'Research', href: '/research' },
          { title: 'Questionnaires', href: '/research/questionnaires' },
          { title: 'Analytics' },
        ];
      }
    }

    // Match admin user detail pages
    if (pathSegments[0] === 'admin' && pathSegments[1] === 'users' && pathSegments.length === 3) {
      return [
        { title: 'Admin', href: '/admin' },
        { title: 'Users', href: '/admin/users' },
        { title: 'User Detail' },
      ];
    }

    // Default: no breadcrumbs
    return [];
  };

  const breadcrumbs = getBreadcrumbs();
  const showBreadcrumbs = breadcrumbs.length > 0;

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex w-full items-center gap-2 px-4">
        {/* Sidebar Toggle */}
        <SidebarTrigger className="-ml-1" />

        {/* Separator */}
        <Separator orientation="vertical" className="h-6" />

        {/* Breadcrumbs - Only show if there are breadcrumbs */}
        {showBreadcrumbs && (
          <div className="flex-1">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}

        {/* Spacer - Only show if no breadcrumbs */}
        {!showBreadcrumbs && <div className="flex-1" />}

        {/* Right Side Actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Notification Bell */}
          <NotificationBell />

          {/* User Navigation Menu */}
          <UserNav user={user} />
        </div>
      </div>
    </header>
  );
}
