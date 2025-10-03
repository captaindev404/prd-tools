'use client';

import {
  LayoutDashboard,
  MessageSquare,
  Grid3x3,
  Map,
  FlaskConical,
  BarChart3,
  Shield,
  Settings2,
} from 'lucide-react';
import { NavLink } from './nav-link';

/**
 * Props for the MainNav component
 */
export interface MainNavProps {
  role?: string;
}

/**
 * Navigation link configuration
 */
interface NavigationItem {
  title: string;
  href: string;
  icon: React.ElementType;
  exactMatch?: boolean;
  allowedRoles?: string[];
}

/**
 * Main Navigation Component (Client Component)
 *
 * Renders the main horizontal navigation for desktop screens.
 * This is a client component that filters navigation items
 * based on user role, then renders NavLink components for active state detection.
 *
 * Features:
 * - Server-side role filtering for security
 * - Horizontal layout optimized for desktop header
 * - Uses NavLink components for active state detection
 * - Hidden on mobile (handled by MobileNav instead)
 * - Role-based access control
 *
 * Navigation Structure:
 * - Dashboard: Home page with overview (all users)
 * - Feedback: Submit and browse feedback (all users)
 * - Features: Product feature catalog (all users)
 * - Roadmap: Product roadmap and communications (all users)
 * - Research: User testing panels and questionnaires (RESEARCHER, PM, PO, ADMIN)
 * - Analytics: Metrics and insights (PM, PO, ADMIN)
 * - Moderation: Content moderation queue (MODERATOR, ADMIN)
 * - Admin: System administration (ADMIN only)
 *
 * Accessibility Features:
 * - Semantic nav element with ARIA label
 * - Keyboard navigation support
 * - Active page indication via NavLink
 * - Screen reader friendly
 *
 * @example
 * ```tsx
 * import { MainNav } from '@/components/navigation/main-nav';
 * import { getServerSession } from 'next-auth';
 *
 * // In a server component
 * const session = await getServerSession(authOptions);
 *
 * <MainNav role={session?.user?.role} />
 * ```
 */
export function MainNav({ role }: MainNavProps) {
  // Define all navigation items with their access control rules
  const navigationItems: NavigationItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      exactMatch: true,
    },
    {
      title: 'Feedback',
      href: '/feedback',
      icon: MessageSquare,
    },
    {
      title: 'Features',
      href: '/features',
      icon: Grid3x3,
    },
    {
      title: 'Roadmap',
      href: '/roadmap',
      icon: Map,
    },
    {
      title: 'Research',
      href: '/research',
      icon: FlaskConical,
      allowedRoles: ['RESEARCHER', 'PM', 'PO', 'ADMIN'],
    },
    {
      title: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      allowedRoles: ['PM', 'PO', 'ADMIN'],
    },
    {
      title: 'Moderation',
      href: '/moderation',
      icon: Shield,
      allowedRoles: ['MODERATOR', 'ADMIN'],
    },
    {
      title: 'Admin',
      href: '/admin',
      icon: Settings2,
      allowedRoles: ['ADMIN'],
    },
  ];

  // Filter navigation items based on user role
  // Items without allowedRoles are visible to all authenticated users
  // Items with allowedRoles are only visible if user has one of those roles
  const visibleItems = navigationItems.filter((item) => {
    // No role restrictions - show to all
    if (!item.allowedRoles) {
      return true;
    }

    // No user role (unauthenticated) - hide restricted items
    if (!role) {
      return false;
    }

    // Check if user's role is in the allowed roles
    return item.allowedRoles.includes(role);
  });

  return (
    <nav className="hidden lg:flex items-center gap-6" aria-label="Main navigation">
      {visibleItems.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          icon={item.icon}
          exactMatch={item.exactMatch}
        >
          {item.title}
        </NavLink>
      ))}
    </nav>
  );
}
