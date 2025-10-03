'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface NavLinkProps {
  href: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  exactMatch?: boolean;
  className?: string;
}

/**
 * NavLink component with active state detection
 *
 * Wraps Next.js Link with visual feedback for the current route.
 * Supports exact and prefix path matching with full accessibility support.
 *
 * Accessibility features:
 * - aria-current="page" for active links
 * - aria-hidden on decorative icons
 * - Visible focus indicators
 * - Keyboard navigable (Enter/Space)
 *
 * @example
 * ```tsx
 * <NavLink href="/dashboard" icon={LayoutDashboard} exactMatch>
 *   Dashboard
 * </NavLink>
 *
 * <NavLink href="/feedback" icon={MessageSquare}>
 *   Feedback
 * </NavLink>
 * ```
 */
export function NavLink({
  href,
  icon: Icon,
  children,
  exactMatch = false,
  className
}: NavLinkProps) {
  const pathname = usePathname();

  // Determine if this link is active
  // exactMatch: pathname must exactly equal href (e.g., "/dashboard")
  // prefix match: pathname starts with href (e.g., "/feedback" matches "/feedback/new")
  const isActive = exactMatch
    ? pathname === href
    : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 transition-colors rounded-md px-2 py-1.5",
        // Focus styles for keyboard navigation
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isActive
          ? "text-foreground font-medium"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {Icon && <Icon className="h-5 w-5" aria-hidden="true" />}
      <span>{children}</span>
    </Link>
  );
}
