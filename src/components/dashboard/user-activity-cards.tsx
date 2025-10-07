import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MessageSquare,
  ThumbsUp,
  FileQuestion,
  ArrowRight,
  Lightbulb,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { prisma } from '@/lib/prisma';

/**
 * User Activity Cards Component
 *
 * Displays activity summary cards for USER role showing:
 * - My Feedback: Count of feedback submitted by the user
 * - My Votes: Count of votes cast by the user
 * - Pending Questionnaires: Count of unanswered questionnaires available to user
 *
 * Features:
 * - Each card is clickable and links to relevant section
 * - Shows loading states with skeletons
 * - Handles empty states gracefully
 * - Responsive grid layout (1 col mobile, 2 cols tablet, 3 cols desktop)
 * - Uses Lucide icons for visual clarity (MessageSquare, ThumbsUp, FileQuestion)
 * - Server-side data fetching with parallel Prisma queries
 *
 * Accessibility Features:
 * - Proper heading hierarchy (h2 for section title)
 * - ARIA labels for card links and icons
 * - Keyboard navigable card links
 * - Screen reader announcements for counts and badges
 * - Clear focus indicators on interactive elements
 * - Decorative icons marked with aria-hidden
 *
 * Usage:
 * ```tsx
 * <UserActivityCards userId={session.user.id} />
 * ```
 */

interface UserActivityCardsProps {
  userId: string;
}

/**
 * Activity card data structure
 */
interface ActivityCardData {
  title: string;
  count: number;
  description: string;
  icon: React.ElementType;
  href: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info';
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  };
}

/**
 * Get user activity statistics
 *
 * Fetches all required counts in parallel for optimal performance:
 * - User's feedback submissions
 * - User's votes cast
 * - Pending questionnaires (published, within date range, not yet answered by user)
 */
async function getUserActivityData(userId: string): Promise<ActivityCardData[]> {
  try {
    // Execute all queries in parallel for efficiency
    const [
      myFeedbackCount,
      myVotesCount,
      pendingQuestionnairesCount,
      recentFeedbackWithVotes,
    ] = await Promise.all([
      // Count of feedback submitted by user
      prisma.feedback.count({
        where: { authorId: userId },
      }),

      // Count of votes cast by user
      prisma.vote.count({
        where: { userId },
      }),

      // Count of pending questionnaires (published, active, not yet answered)
      // First get all published questionnaires that are currently active
      prisma.questionnaire.findMany({
        where: {
          status: 'published',
          OR: [
            {
              AND: [
                { startAt: { lte: new Date() } },
                { endAt: { gte: new Date() } },
              ],
            },
            {
              AND: [
                { startAt: { lte: new Date() } },
                { endAt: null },
              ],
            },
            {
              AND: [
                { startAt: null },
                {
                  OR: [
                    { endAt: { gte: new Date() } },
                    { endAt: null },
                  ],
                },
              ],
            },
          ],
        },
        select: {
          id: true,
        },
      }).then(async (questionnaires) => {
        // Get IDs of questionnaires user has already responded to
        const userResponses = await prisma.questionnaireResponse.findMany({
          where: {
            respondentId: userId,
            questionnaireId: { in: questionnaires.map(q => q.id) },
          },
          select: { questionnaireId: true },
        });

        const answeredIds = new Set(userResponses.map(r => r.questionnaireId));

        // Count questionnaires not yet answered
        return questionnaires.filter(q => !answeredIds.has(q.id)).length;
      }),

      // Get user's recent feedback with vote counts for contextual info
      prisma.feedback.findMany({
        where: { authorId: userId },
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { votes: true },
          },
        },
      }),
    ]);

    // Calculate if user has recent activity (feedback in last 7 days)
    const hasRecentFeedback =
      recentFeedbackWithVotes.length > 0 &&
      recentFeedbackWithVotes[0] &&
      new Date(recentFeedbackWithVotes[0].createdAt).getTime() >
        Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Build activity cards data
    const cards: ActivityCardData[] = [
      {
        title: 'My Feedback',
        count: myFeedbackCount,
        description:
          myFeedbackCount === 0
            ? 'Start sharing your ideas'
            : myFeedbackCount === 1
            ? 'idea submitted'
            : 'ideas submitted',
        icon: MessageSquare,
        href: '/feedback?filter=my-feedback',
        variant: 'primary',
        badge: hasRecentFeedback
          ? {
              text: 'Active',
              variant: 'default',
            }
          : undefined,
      },
      {
        title: 'My Votes',
        count: myVotesCount,
        description:
          myVotesCount === 0
            ? 'Vote on ideas you support'
            : myVotesCount === 1
            ? 'vote cast'
            : 'votes cast',
        icon: ThumbsUp,
        href: '/feedback?filter=my-votes',
        variant: 'success',
      },
      {
        title: 'Pending Questionnaires',
        count: pendingQuestionnairesCount,
        description:
          pendingQuestionnairesCount === 0
            ? 'All caught up!'
            : pendingQuestionnairesCount === 1
            ? 'questionnaire awaiting response'
            : 'questionnaires awaiting response',
        icon: FileQuestion,
        href: '/questionnaires',
        variant: 'warning',
        badge:
          pendingQuestionnairesCount > 0
            ? {
                text: 'New',
                variant: 'destructive',
              }
            : undefined,
      },
    ];

    return cards;
  } catch (error) {
    console.error('Error fetching user activity data:', error);
    // Return empty state cards on error
    return [
      {
        title: 'My Feedback',
        count: 0,
        description: 'Unable to load data',
        icon: MessageSquare,
        href: '/feedback?filter=my-feedback',
        variant: 'primary',
      },
      {
        title: 'My Votes',
        count: 0,
        description: 'Unable to load data',
        icon: ThumbsUp,
        href: '/feedback?filter=my-votes',
        variant: 'success',
      },
      {
        title: 'Pending Questionnaires',
        count: 0,
        description: 'Unable to load data',
        icon: FileQuestion,
        href: '/questionnaires',
        variant: 'warning',
      },
    ];
  }
}

/**
 * Main UserActivityCards component
 *
 * Server component that fetches and displays user activity cards
 */
export async function UserActivityCards({ userId }: UserActivityCardsProps) {
  const cards = await getUserActivityData(userId);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 id="activity-heading" className="text-lg sm:text-xl font-bold tracking-tight">
            Activity Summary
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Your engagement with Gentil Feedback
          </p>
        </div>
        <Lightbulb className="h-5 w-5 text-yellow-500 flex-shrink-0" aria-hidden="true" />
      </div>

      {/* Activity Cards Grid - Responsive: 1 col mobile, 2 cols tablet, 3 cols desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" role="list" aria-label="Activity statistics">
        {cards.map((card) => (
          <ActivityCard key={card.title} {...card} />
        ))}
      </div>

      {/* Helpful Tips Section - Mobile optimized */}
      {cards[0] && cards[1] && cards[0].count === 0 && cards[1].count === 0 && (
        <Card className="bg-blue-50/50 border-blue-200" role="region" aria-label="Getting started guide">
          <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div className="space-y-2 flex-1">
                <h3 className="font-semibold text-sm text-blue-900">
                  Get Started with Gentil Feedback
                </h3>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Share your ideas and vote on features you care about. Your
                  feedback directly influences our product roadmap!
                </p>
                <nav className="flex flex-col sm:flex-row gap-2 pt-2" aria-label="Getting started actions">
                  <Link
                    href="/feedback/new"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 underline min-h-[44px] flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded"
                    aria-label="Submit your first idea"
                  >
                    Submit your first idea
                  </Link>
                  <span className="hidden sm:inline text-xs text-blue-600" aria-hidden="true">•</span>
                  <Link
                    href="/feedback"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 underline min-h-[44px] sm:min-h-0 flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded"
                    aria-label="Explore existing feedback"
                  >
                    Explore feedback
                  </Link>
                </nav>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Individual Activity Card Component
 *
 * Displays a single activity metric with icon, count, and description.
 * Card is clickable and navigates to the relevant section.
 */
interface ActivityCardProps extends ActivityCardData {}

function ActivityCard({
  title,
  count,
  description,
  icon: Icon,
  href,
  variant = 'default',
  badge,
}: ActivityCardProps) {
  // Create accessible label for the card
  const ariaLabel = badge
    ? `${title}: ${count} ${description}. ${badge.text} badge.`
    : `${title}: ${count} ${description}`;

  return (
    <Link
      href={href}
      className="group block min-h-[120px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-lg"
      aria-label={ariaLabel}
      role="listitem"
    >
      <Card
        className={cn(
          'transition-all hover:shadow-md cursor-pointer border-2 h-full',
          'hover:border-primary/50 active:scale-95 sm:hover:scale-105',
          variant === 'primary' && 'border-blue-200 bg-blue-50/30',
          variant === 'success' && 'border-green-200 bg-green-50/30',
          variant === 'warning' && 'border-amber-200 bg-amber-50/30',
          variant === 'info' && 'border-purple-200 bg-purple-50/30'
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {badge && (
              <Badge
                variant={badge.variant || 'default'}
                className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0"
                aria-label={badge.text}
              >
                {badge.text}
              </Badge>
            )}
            <Icon
              className={cn(
                'h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0',
                variant === 'default' && 'text-muted-foreground',
                variant === 'primary' && 'text-blue-600',
                variant === 'success' && 'text-green-600',
                variant === 'warning' && 'text-amber-600',
                variant === 'info' && 'text-purple-600'
              )}
              aria-hidden="true"
            />
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="space-y-1.5 sm:space-y-2">
            {/* Main Count */}
            <div className="flex items-baseline justify-between">
              <div
                className={cn(
                  'text-2xl sm:text-3xl font-bold tracking-tight',
                  count === 0 && 'text-muted-foreground'
                )}
                aria-live="polite"
              >
                {count}
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" aria-hidden="true" />
            </div>

            {/* Description */}
            <CardDescription className="text-xs sm:text-xs leading-relaxed">
              {description}
            </CardDescription>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Loading Skeleton Component
 *
 * Displays skeleton placeholders while data is loading.
 * Matches the layout of the actual activity cards.
 * Uses 3-column grid: 1 col mobile, 2 cols tablet, 3 cols desktop.
 */
export function UserActivityCardsLoading() {
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
          <Skeleton className="h-3 sm:h-4 w-48 sm:w-60" />
        </div>
        <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
      </div>

      {/* Cards Grid Skeleton - 3 cards for USER role */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="min-h-[120px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 sm:px-6 pt-4 sm:pt-6">
              <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
              <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="space-y-1.5 sm:space-y-2">
                <Skeleton className="h-8 sm:h-9 w-12 sm:w-16" />
                <Skeleton className="h-3 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Empty State Component
 *
 * Displays when user has no activity yet.
 * Provides helpful guidance on getting started.
 */
export function UserActivityCardsEmpty() {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Activity Summary</h2>
          <p className="text-sm text-muted-foreground">
            Your engagement with Gentil Feedback
          </p>
        </div>
      </div>

      {/* Empty State Card */}
      <Card className="border-dashed">
        <CardContent className="pt-12 pb-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Welcome to Gentil Feedback!</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Get started by sharing your ideas or voting on existing feedback.
                Your input helps shape the future of our products.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Link
                href="/feedback/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <MessageSquare className="h-4 w-4" />
                Submit Feedback
              </Link>
              <Link
                href="/feedback"
                className="inline-flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition-colors text-sm font-medium"
              >
                <TrendingUp className="h-4 w-4" />
                Browse Ideas
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
