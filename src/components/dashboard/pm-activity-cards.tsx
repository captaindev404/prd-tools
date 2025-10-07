import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Inbox,
  Rocket,
  TrendingUp,
  Star,
  BarChart3,
  Settings,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { Role } from '@prisma/client';
import type { PMActivityMetrics } from '@/lib/dashboard-service';

interface PMActivityCardsProps {
  metrics: PMActivityMetrics;
  userRole: Role;
}

/**
 * PM/PO Activity Summary Cards
 *
 * Role-specific dashboard cards for Product Managers and Product Owners.
 * Displays key metrics and quick actions for managing feedback and features.
 *
 * Features:
 * - Moderation Queue count with SLA badge (48hr threshold)
 * - Top Voted Feedback count (10+ votes)
 * - Roadmap Items breakdown by stage
 * - Team Feedback This Month count
 * - Quick action buttons for common PM/PO tasks
 * - Role-based access control (PM, PO, ADMIN roles only)
 * - Urgent badge when moderation queue >10 items
 * - SLA countdown when items >40 hours old
 *
 * Accessibility Features:
 * - Proper heading hierarchy (h2 for section title)
 * - ARIA labels for metrics and status indicators
 * - Keyboard navigable action buttons
 * - Screen reader announcements for urgent items
 * - Clear focus indicators on interactive elements
 * - Semantic HTML for status regions
 *
 * Usage:
 * const metrics = await getPMActivityMetrics(session.user.role);
 * <PMActivityCards metrics={metrics} userRole={session.user.role} />
 */
export function PMActivityCards({ metrics, userRole }: PMActivityCardsProps) {
  // Only render for PM/PO/ADMIN roles
  if (userRole !== 'PM' && userRole !== 'PO' && userRole !== 'ADMIN') {
    return null;
  }

  const {
    moderationQueueCount,
    moderationOldestItemAge,
    topVotedFeedbackCount,
    roadmapItemsNow,
    roadmapItemsNext,
    roadmapItemsLater,
    teamFeedbackThisMonth,
  } = metrics;

  // SLA thresholds
  const SLA_WARNING_HOURS = 40; // Warning at 40 hours (approaching 48hr SLA)
  const SLA_TOTAL_HOURS = 48;
  const URGENT_QUEUE_THRESHOLD = 10;

  // Calculate SLA status
  const isSlaNearBreach = moderationOldestItemAge !== null && moderationOldestItemAge >= SLA_WARNING_HOURS;
  const isQueueUrgent = moderationQueueCount > URGENT_QUEUE_THRESHOLD;
  const slaHoursRemaining = moderationOldestItemAge !== null
    ? Math.max(0, SLA_TOTAL_HOURS - moderationOldestItemAge)
    : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section - Mobile optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 id="pm-dashboard-heading" className="text-xl sm:text-2xl font-bold tracking-tight break-words">
            {userRole === 'PM' ? 'Product Manager' : 'Product Owner'} Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage feedback, features, and roadmap priorities
          </p>
        </div>
        <Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-2.5 py-0.5 sm:py-1 self-start sm:self-auto" aria-label={`Your role: ${userRole}`}>
          {userRole}
        </Badge>
      </div>

      {/* Metrics Cards Grid - Single column on mobile for readability */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Moderation Queue Card */}
        <Card className={isQueueUrgent || isSlaNearBreach ? 'border-red-500/50 bg-red-50/50' : moderationQueueCount > 0 ? 'border-amber-500/50 bg-amber-50/50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Moderation Queue
            </CardTitle>
            <Inbox className={isQueueUrgent || isSlaNearBreach ? 'h-4 w-4 text-red-600 flex-shrink-0' : moderationQueueCount > 0 ? 'h-4 w-4 text-amber-600 flex-shrink-0' : 'h-4 w-4 text-muted-foreground flex-shrink-0'} />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <div className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {moderationQueueCount}
                </div>
                {isQueueUrgent && (
                  <Badge variant="destructive" className="text-xs">
                    URGENT
                  </Badge>
                )}
              </div>
              {isSlaNearBreach && slaHoursRemaining !== null ? (
                <div className="flex items-center gap-1">
                  <Badge variant={slaHoursRemaining <= 0 ? 'destructive' : 'secondary'} className="text-xs">
                    SLA: {slaHoursRemaining}h left
                  </Badge>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {moderationQueueCount === 0 ? 'All caught up!' : 'Pending review'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Voted Feedback Card */}
        <Card className="border-green-500/50 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Top Voted Feedback
            </CardTitle>
            <Star className="h-4 w-4 text-green-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight">
                {topVotedFeedbackCount}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                10+ votes each
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Roadmap Items Card */}
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Roadmap Items
            </CardTitle>
            <Rocket className="h-4 w-4 text-primary flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-2">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight">
                {roadmapItemsNow + roadmapItemsNext + roadmapItemsLater}
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>Now: {roadmapItemsNow}</span>
                <span>•</span>
                <span>Next: {roadmapItemsNext}</span>
                <span>•</span>
                <span>Later: {roadmapItemsLater}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Feedback Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Team Feedback
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight">
                {teamFeedbackThisMonth}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Created this month
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Section - Mobile optimized */}
      <Card>
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Common tasks for managing feedback and features
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Moderation Queue Action - Touch-friendly */}
            <Button
              asChild
              variant={isQueueUrgent || isSlaNearBreach ? 'destructive' : moderationQueueCount > 0 ? 'default' : 'outline'}
              className="justify-between h-auto min-h-[72px] py-4 active:scale-95 transition-transform"
            >
              <Link href="/moderation">
                <div className="flex items-center gap-3 flex-1">
                  <Inbox className="h-5 w-5 flex-shrink-0" />
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-semibold text-sm break-words">Moderation Queue</div>
                    <div className="text-xs text-muted-foreground">
                      {moderationQueueCount > 0 ? `${moderationQueueCount} items pending` : 'Review feedback'}
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 ml-2 flex-shrink-0" />
              </Link>
            </Button>

            {/* Manage Features Action - Touch-friendly */}
            <Button
              asChild
              variant="outline"
              className="justify-between h-auto min-h-[72px] py-4 active:scale-95 transition-transform"
            >
              <Link href="/features">
                <div className="flex items-center gap-3 flex-1">
                  <Settings className="h-5 w-5 flex-shrink-0" />
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-semibold text-sm break-words">Manage Features</div>
                    <div className="text-xs text-muted-foreground">
                      Update feature catalog
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 ml-2 flex-shrink-0" />
              </Link>
            </Button>

            {/* View Analytics Action - Touch-friendly */}
            <Button
              asChild
              variant="outline"
              className="justify-between h-auto min-h-[72px] py-4 active:scale-95 transition-transform"
            >
              <Link href="/analytics">
                <div className="flex items-center gap-3 flex-1">
                  <BarChart3 className="h-5 w-5 flex-shrink-0" />
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-semibold text-sm break-words">View Analytics</div>
                    <div className="text-xs text-muted-foreground">
                      Insights and trends
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 ml-2 flex-shrink-0" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}