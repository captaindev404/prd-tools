import * as React from 'react';
import { getSession } from '@/lib/session';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { SkipNav } from '@/components/layout/skip-nav';

/**
 * Props for AppLayout
 */
interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * AppLayout Component
 *
 * Main layout wrapper for authenticated pages in the Odyssey Feedback platform.
 * Integrates the sidebar navigation, header with breadcrumbs, and main content area.
 *
 * Features:
 * - Persistent sidebar navigation with role-based filtering
 * - Collapsible sidebar with mobile support
 * - Dynamic breadcrumb navigation in header
 * - Responsive layout that adapts to screen size
 * - Server-side session handling
 *
 * Layout Structure:
 * ```
 * <SidebarProvider>
 *   <AppSidebar />
 *   <SidebarInset>
 *     <AppHeader />
 *     <main>{children}</main>
 *   </SidebarInset>
 * </SidebarProvider>
 * ```
 *
 * Usage:
 * Wrap your authenticated page content with this layout component:
 *
 * @example
 * ```tsx
 * // In your page.tsx
 * import { AppLayout } from '@/components/layout/app-layout';
 *
 * export default async function DashboardPage() {
 *   return (
 *     <AppLayout>
 *       <div className="p-6">
 *         <h1>Dashboard</h1>
 *         // ... your page content
 *       </div>
 *     </AppLayout>
 *   );
 * }
 * ```
 *
 * Or use it as a layout component in your route group:
 * @example
 * ```tsx
 * // In app/(authenticated)/layout.tsx
 * import { AppLayout } from '@/components/layout/app-layout';
 *
 * export default function AuthenticatedLayout({ children }) {
 *   return <AppLayout>{children}</AppLayout>;
 * }
 * ```
 *
 * @param children - Page content to render in the main area
 */
export async function AppLayout({ children }: AppLayoutProps) {
  // Fetch session server-side
  const session = await getSession();

  // If no session, redirect will be handled by middleware or requireAuth
  // This component assumes it's used in authenticated routes
  if (!session) {
    return null;
  }

  return (
    <>
      {/* Skip Navigation Link - First focusable element for keyboard users */}
      <SkipNav />

      <SidebarProvider>
        {/* Sidebar Navigation */}
        <AppSidebar userRole={session.user.role} />

        {/* Main Content Area */}
        <SidebarInset>
          {/* Header with Breadcrumbs */}
          <AppHeader user={session.user} />

          {/* Page Content - Accessible via skip link */}
          <main
            id="main-content"
            className="flex flex-1 flex-col"
            tabIndex={-1}
            aria-label="Main content"
          >
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
