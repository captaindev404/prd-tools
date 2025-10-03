import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Dashboard Loading State
 *
 * Provides a comprehensive loading skeleton for the dashboard page that:
 * - Matches the exact layout structure of the actual dashboard
 * - Prevents cumulative layout shift (CLS) by using same dimensions
 * - Uses smooth, non-distracting animations via Skeleton component
 * - Maintains responsive behavior across all breakpoints
 * - Provides accessible loading announcements for screen readers
 *
 * This loading UI is automatically shown by Next.js App Router while
 * the dashboard page is loading (both initial and Suspense boundaries).
 *
 * Layout Structure:
 * 1. Header with app title and user navigation area
 * 2. Welcome section with greeting and quick actions
 * 3. PM/PO activity cards (conditional, shown for PM/PO/ADMIN roles)
 * 4. User activity cards grid (3 cards)
 * 5. Quick actions section with 4 action buttons
 * 6. Trending feedback list with 5 items
 *
 * Accessibility:
 * - aria-live="polite" announces loading state to screen readers
 * - aria-busy="true" indicates content is loading
 * - Maintains same semantic structure as actual content
 */
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Skip to main content link - hidden during loading */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Header Skeleton */}
      <header className="bg-white shadow" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-3">
            {/* Mobile Menu Skeleton - Only visible on mobile */}
            <div className="lg:hidden">
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>

            {/* Logo and Title Skeleton */}
            <div className="flex-1 min-w-0 space-y-1">
              <Skeleton className="h-6 sm:h-8 w-48" />
              <Skeleton className="h-4 w-56 hidden sm:block" />
            </div>

            {/* Desktop Navigation Skeleton - Only visible on desktop */}
            <nav className="hidden lg:flex gap-2 sm:gap-4 items-center flex-shrink-0" aria-label="User navigation">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </nav>

            {/* Mobile Right Side Skeleton - Only Notification Bell */}
            <div className="flex lg:hidden gap-2 items-center flex-shrink-0">
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8"
        role="main"
        aria-busy="true"
        aria-live="polite"
        aria-label="Dashboard is loading"
      >
        {/* Screen reader announcement */}
        <div className="sr-only" role="status">
          Loading your dashboard, please wait...
        </div>

        {/* Welcome Section Skeleton */}
        <section className="mb-6 sm:mb-8" aria-labelledby="welcome-heading-skeleton">
          <WelcomeSectionSkeleton />
        </section>

        {/* PM/PO Activity Cards Skeleton - Shown for PM/PO/ADMIN roles */}
        <section className="mb-6 sm:mb-8" aria-labelledby="pm-dashboard-heading-skeleton">
          <PMActivityCardsSkeleton />
        </section>

        {/* User Activity Cards Skeleton */}
        <section className="mb-6 sm:mb-8" aria-labelledby="activity-heading-skeleton">
          <UserActivityCardsSkeleton />
        </section>

        {/* Quick Actions Section Skeleton */}
        <section className="mb-6 sm:mb-8" aria-labelledby="quick-actions-heading-skeleton">
          <QuickActionsSkeleton />
        </section>

        {/* Trending Feedback Section Skeleton */}
        <section className="mb-6 sm:mb-8" aria-labelledby="trending-heading-skeleton">
          <TrendingFeedbackSkeleton />
        </section>
      </main>
    </div>
  );
}

/**
 * Welcome Section Skeleton
 *
 * Matches the layout of WelcomeSection component:
 * - 3-column grid on large screens, single column on mobile
 * - Left: Greeting, role message, and action buttons
 * - Right: Date and time display
 */
function WelcomeSectionSkeleton() {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left column: Greeting and role message */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {/* Greeting */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <Skeleton className="h-5 w-5 sm:h-6 sm:w-6 rounded" />
                <Skeleton className="h-6 sm:h-8 lg:h-9 w-64 sm:w-80" />
              </div>
              <Skeleton className="h-4 sm:h-5 w-full max-w-2xl" />
            </div>

            {/* User context: Role and Village */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 sm:pt-2">
              <Skeleton className="h-6 sm:h-7 w-20" />
              <Skeleton className="h-6 w-32" />
            </div>

            {/* Quick action buttons */}
            <nav className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4" aria-label="Quick actions">
              <Skeleton className="h-11 w-full sm:w-44" />
              <Skeleton className="h-11 w-full sm:w-40" />
            </nav>
          </div>

          {/* Right column: Date and time */}
          <div className="flex flex-col justify-center items-start lg:items-end space-y-1 pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l lg:pl-6 border-blue-200">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 sm:h-6 lg:h-7 w-56 sm:w-64" />
            <Skeleton className="h-7 sm:h-8 w-28" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * PM/PO Activity Cards Skeleton
 *
 * Matches the layout of PMActivityCards component:
 * - Role-specific dashboard for PM/PO/ADMIN
 * - 4 metric cards + quick actions section
 */
function PMActivityCardsSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Skeleton className="h-6 sm:h-8 w-64" />
          <Skeleton className="h-4 w-80 mt-2" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 sm:px-6 pt-4 sm:pt-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="space-y-2">
                <Skeleton className="h-8 sm:h-9 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * User Activity Cards Skeleton
 *
 * Matches the layout of UserActivityCards component:
 * - Section header with title and description
 * - 3-card grid (1 col mobile, 2 cols tablet, 3 cols desktop)
 * - Each card shows: title, count, description, icon
 */
function UserActivityCardsSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-5 sm:h-6 w-40" />
          <Skeleton className="h-3 sm:h-4 w-60" />
        </div>
        <Skeleton className="h-5 w-5 rounded" />
      </div>

      {/* Activity Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" role="list" aria-label="Activity statistics loading">
        {[1, 2, 3].map((i) => (
          <Card
            key={i}
            className="border-2 min-h-[120px]"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 sm:px-6 pt-4 sm:pt-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-baseline justify-between">
                  <Skeleton className="h-8 sm:h-9 w-16" />
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
                <Skeleton className="h-3 sm:h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Quick Actions Skeleton
 *
 * Matches the layout of QuickActions component:
 * - Card header with title and description
 * - 4-button grid (1 col mobile, 2 cols tablet, 4 cols desktop)
 * - Each button shows: icon, title, description
 */
function QuickActionsSkeleton() {
  return (
    <Card>
      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="space-y-2">
          <Skeleton className="h-5 sm:h-6 w-32" />
          <Skeleton className="h-3 sm:h-4 w-48" />
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-label="Quick action shortcuts loading">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-auto min-h-[80px] sm:min-h-[88px] border rounded-md p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </nav>
      </CardContent>
    </Card>
  );
}

/**
 * Trending Feedback Skeleton
 *
 * Matches the layout of TrendingFeedback component:
 * - Card header with title and "View all" link
 * - List of 5 trending items
 * - Each item shows: rank badge, title, preview, metadata
 */
function TrendingFeedbackSkeleton() {
  return (
    <Card>
      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 sm:h-6 w-40" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-3 sm:h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        <nav className="space-y-3 sm:space-y-4" role="list" aria-label="Trending feedback items loading">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="border rounded-lg p-3 sm:p-4 min-h-[100px]"
            >
              <div className="flex items-start gap-2 sm:gap-3">
                {/* Rank Badge */}
                <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex-shrink-0" />

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-4 sm:h-5 w-full max-w-md" />
                  <Skeleton className="h-3 w-full max-w-lg" />
                  <Skeleton className="h-3 w-3/4 max-w-md" />

                  {/* Metadata */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap pt-1">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </nav>
      </CardContent>
    </Card>
  );
}
