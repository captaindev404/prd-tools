import { requireAuth } from '@/lib/session';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { TrendingFeedback } from '@/components/dashboard/trending-feedback';
import { WelcomeSection } from '@/components/dashboard/welcome-section';
import { UserActivityCards, UserActivityCardsLoading } from '@/components/dashboard/user-activity-cards';
import { PMActivityCards } from '@/components/dashboard/pm-activity-cards';
import { getPMActivityMetrics } from '@/lib/dashboard-service';

/**
 * Dashboard Page
 *
 * This is a protected page that requires authentication.
 * Demonstrates how to use requireAuth() to protect server components.
 *
 * Accessibility Features:
 * - Semantic HTML with proper heading hierarchy (h1 for page title)
 * - ARIA landmarks for navigation (<header>, <main>)
 * - Skip to main content link for keyboard users
 * - Proper ARIA labels for user info and navigation
 * - Screen reader-friendly content structure
 *
 * Performance Optimizations:
 * - React Suspense for progressive rendering
 * - Granular loading states for each section
 * - Streaming data with Next.js Server Components
 * - Redis caching for expensive queries (1-5 min TTL)
 * - Parallel data fetching within Suspense boundaries
 * - Database query optimization with indices
 * - Dynamic rendering for personalized content
 */

// Force dynamic rendering for user-specific content
export const dynamic = 'force-dynamic';
// Revalidate every 60 seconds for semi-static parts
export const revalidate = 60;

export default async function DashboardPage() {
  const session = await requireAuth();

  // Fetch PM/PO metrics if user has appropriate role
  const isPMRole = session.user.role === 'PM' || session.user.role === 'PO' || session.user.role === 'ADMIN';
  const pmMetrics = isPMRole ? await getPMActivityMetrics(session.user.role) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Welcome Section */}
        <section className="mb-6 sm:mb-8" aria-labelledby="welcome-heading">
          <WelcomeSection
            user={{
              displayName: session.user.displayName,
              email: session.user.email,
              role: session.user.role,
              currentVillageId: session.user.currentVillageId,
            }}
          />
        </section>

        {/* PM/PO Activity Cards - Only for PM, PO, and ADMIN roles */}
        {pmMetrics && (
          <section className="mb-6 sm:mb-8" aria-labelledby="pm-dashboard-heading">
            <PMActivityCards metrics={pmMetrics} userRole={session.user.role} />
          </section>
        )}

        {/* User Activity Summary Cards - With Suspense for streaming */}
        <section className="mb-6 sm:mb-8" aria-labelledby="activity-heading">
          <Suspense fallback={<UserActivityCardsLoading />}>
            <UserActivityCards userId={session.user.id} />
          </Suspense>
        </section>

        {/* Quick Actions Section - Static, no Suspense needed */}
        <section className="mb-6 sm:mb-8" aria-labelledby="quick-actions-heading">
          <QuickActions
            userRole={session.user.role}
            userConsents={session.user.consents}
          />
        </section>

        {/* Trending Feedback Section - With Suspense for expensive query */}
        <section className="mb-6 sm:mb-8" aria-labelledby="trending-heading">
          <Suspense fallback={<TrendingFeedbackLoading />}>
            <TrendingFeedback limit={5} maxAgeInDays={14} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for Trending Feedback section
 *
 * Displays while trending feedback data is being fetched.
 * Matches the layout of the actual component for smooth transitions.
 */
function TrendingFeedbackLoading() {
  return (
    <Card>
      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border rounded-lg p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
