'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Menu,
  LayoutDashboard,
  MessageSquare,
  Grid3x3,
  Map,
  FlaskConical,
  Settings,
  LogOut,
} from 'lucide-react';
import { Role } from '@prisma/client';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/**
 * Props for the MobileNav component
 */
export interface MobileNavProps {
  user: {
    name?: string | null;
    email: string;
    role: string;
    avatar?: string | null;
  };
}

/**
 * Navigation link configuration
 */
interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRoles?: Role[];
}

/**
 * Mobile Navigation Component
 *
 * A responsive mobile navigation drawer that provides:
 * - Hamburger menu trigger (visible only on mobile)
 * - User profile section at top
 * - Main navigation links with icons
 * - Role-based conditional links
 * - Sign out functionality
 * - Smooth slide-in animation
 * - Auto-close on navigation
 *
 * Accessibility Features:
 * - Minimum 44x44px touch targets
 * - Keyboard navigation support
 * - ARIA labels for screen readers
 * - Focus management
 * - Semantic HTML structure
 *
 * @example
 * ```tsx
 * import { MobileNav } from '@/components/navigation/mobile-nav';
 *
 * <MobileNav
 *   user={{
 *     name: "John Doe",
 *     email: "john@example.com",
 *     role: "USER",
 *     avatar: null
 *   }}
 * />
 * ```
 */
export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  // Main navigation links
  const navLinks: NavLink[] = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/feedback',
      label: 'Feedback',
      icon: MessageSquare,
    },
    {
      href: '/features',
      label: 'Features',
      icon: Grid3x3,
    },
    {
      href: '/roadmap',
      label: 'Roadmap',
      icon: Map,
    },
    {
      href: '/research/panels',
      label: 'Research',
      icon: FlaskConical,
      requiredRoles: [Role.RESEARCHER, Role.PM, Role.ADMIN, Role.PO],
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  // Filter links based on user role
  const visibleLinks = navLinks.filter((link) => {
    if (!link.requiredRoles) return true;
    return link.requiredRoles.includes(user.role as Role);
  });

  // Get user initials for avatar fallback
  const getInitials = (name?: string | null, email?: string): string => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return (email || 'U').slice(0, 2).toUpperCase();
  };

  // Close sheet on navigation
  const handleLinkClick = () => {
    setIsOpen(false);
  };

  // Handle sign out with loading state
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({
        callbackUrl: '/',
      });
    } catch (error) {
      console.error('Sign out failed:', error);
      setIsSigningOut(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden min-h-[44px] min-w-[44px]"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
        <div className="flex flex-col h-full">
          {/* Header with User Info */}
          <SheetHeader className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                {user.avatar && <AvatarImage src={user.avatar} alt={user.name || user.email} />}
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left">
                <SheetTitle className="text-base font-semibold">
                  {user.name || user.email}
                </SheetTitle>
                <p className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
              </div>
            </div>
          </SheetHeader>

          <Separator />

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-4" aria-label="Mobile navigation">
            <ul className="space-y-1 px-3">
              {visibleLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

                return (
                  <li key={link.href}>
                    <SheetClose asChild>
                      <Link
                        href={link.href}
                        onClick={handleLinkClick}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors min-h-[44px]',
                          'hover:bg-accent hover:text-accent-foreground',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          isActive
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'text-foreground'
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                        <span>{link.label}</span>
                      </Link>
                    </SheetClose>
                  </li>
                );
              })}
            </ul>
          </nav>

          <Separator />

          {/* Sign Out Button */}
          <div className="p-4">
            <Button
              onClick={handleSignOut}
              disabled={isSigningOut}
              variant="ghost"
              className="w-full justify-start gap-3 min-h-[44px] text-sm font-medium hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
              <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
