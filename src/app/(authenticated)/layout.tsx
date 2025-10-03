import { requireAuth } from '@/lib/session';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';

/**
 * Authenticated Layout
 *
 * This layout wraps all authenticated pages in the (authenticated) route group.
 * It ensures users are authenticated before accessing any page within this group.
 *
 * The route group pattern (folders with parentheses) allows organizing routes
 * without affecting the URL structure. This provides:
 * - Shared authentication enforcement
 * - Better code organization
 * - Consistent access control
 * - Cleaner file structure
 *
 * Layout Structure:
 * - SidebarProvider: Context for sidebar state management
 * - AppSidebar: Collapsible navigation sidebar with role-based filtering
 * - AppHeader: Sticky header with breadcrumbs, notifications, and user menu
 * - Main Content: Page content with proper spacing
 *
 * Note: Route groups DO NOT change URLs.
 * - /dashboard stays /dashboard
 * - /feedback stays /feedback
 * - Only file organization changes
 */
export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce authentication for all pages in this route group
  // This will automatically redirect to sign-in if not authenticated
  const session = await requireAuth();

  return (
    <SidebarProvider>
      {/* Skip to main content link for keyboard users - Accessibility Enhancement */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Sidebar Navigation */}
      <AppSidebar userRole={session.user.role} />

      {/* Main Content Area with Header */}
      <SidebarInset>
        {/* App Header with Breadcrumbs */}
        <AppHeader user={session.user} />

        {/* Main Content - ID for skip link target */}
        <main id="main-content" className="flex flex-1 flex-col" tabIndex={-1}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
