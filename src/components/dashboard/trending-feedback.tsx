import Link from 'next/link';
import { memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, ArrowUpRight, MessageSquare, ThumbsUp } from 'lucide-react';
import { getTrendingFeedback } from '@/lib/trending';
import type { TrendingFeedbackItem } from '@/lib/trending';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * TrendingFeedback Component
 *
 * Displays trending feedback items on the dashboard.
 * Uses the trending algorithm to show recent, highly-voted feedback.
 *
 * Features:
 * - Shows top trending items (last 14 days)
 * - Displays vote count and creation date
 * - Links to feedback detail pages
 * - Shows product area badges
 * - Handles empty state gracefully
 *
 * Accessibility Features:
 * - Proper heading hierarchy (h2 for section title)
 * - List semantics for trending items
 * - ARIA labels for link context
 * - Decorative icons marked with aria-hidden
 * - Keyboard navigable links
 * - Screen reader-friendly ranking and metadata
 */

interface TrendingFeedbackProps {
  limit?: number;
  maxAgeInDays?: number;
}

export async function TrendingFeedback({
  limit = 5,
  maxAgeInDays = 14,
}: TrendingFeedbackProps) {
  // Fetch trending feedback items
  const trendingItems = await getTrendingFeedback({
    limit,
    maxAgeInDays,
    minVotes: 1, // Require at least 1 vote to be trending
  });

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <TrendingUp className="h-5 w-5 text-amber-500 flex-shrink-0" aria-hidden="true" />
            <CardTitle id="trending-heading" className="text-lg sm:text-xl truncate">Trending Feedback</CardTitle>
          </div>
          <Link
            href="/feedback?sortBy=votes"
            className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 flex-shrink-0 min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded"
            aria-label="View all feedback sorted by votes"
          >
            View all
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <CardDescription className="text-xs sm:text-sm">
          Most popular feedback from the last {maxAgeInDays} days
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        {trendingItems.length === 0 ? (
          <EmptyStateTrending />
        ) : (
          <nav className="space-y-3 sm:space-y-4" role="list" aria-label="Trending feedback items">
            {trendingItems.map((item, index) => (
              <TrendingFeedbackItem
                key={item.id}
                item={item}
                rank={index + 1}
              />
            ))}
          </nav>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Individual trending feedback item component
 *
 * Memoized to prevent unnecessary re-renders when parent updates.
 */
interface TrendingFeedbackItemProps {
  item: TrendingFeedbackItem;
  rank: number;
}

const TrendingFeedbackItem = memo(function TrendingFeedbackItem({
  item,
  rank,
}: TrendingFeedbackItemProps) {
  // Truncate body for preview - shorter on mobile
  const bodyPreview = item.body.length > 100
    ? `${item.body.slice(0, 100)}...`
    : item.body;

  // Format creation date
  const timeAgo = formatDistanceToNow(new Date(item.createdAt), {
    addSuffix: true,
  });

  // Get state badge variant
  const stateBadgeVariant = getStateBadgeVariant(item.state);

  const ariaLabel = `Rank ${rank}: ${item.title}. ${item.voteCount} votes. ${timeAgo}. ${item.feature ? `Product area: ${item.feature.area}. ` : ''}Status: ${formatState(item.state)}`;

  return (
    <Link
      href={`/feedback/${item.id}`}
      className="block group min-h-[100px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-lg"
      aria-label={ariaLabel}
      role="listitem"
    >
      <div className="border rounded-lg p-3 sm:p-4 hover:border-primary hover:shadow-md active:scale-[0.98] transition-all">
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Rank Badge - Touch-friendly size */}
          <div className="flex-shrink-0">
            <div
              className={`
                w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm
                ${rank === 1 ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300' : ''}
                ${rank === 2 ? 'bg-gray-200 text-gray-700 border-2 border-gray-300' : ''}
                ${rank === 3 ? 'bg-amber-100 text-amber-700 border-2 border-amber-300' : ''}
                ${rank > 3 ? 'bg-muted text-muted-foreground' : ''}
              `}
              aria-label={`Rank ${rank}`}
            >
              {rank}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
              <h3 className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors line-clamp-2 break-words">
                {item.title}
              </h3>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" aria-hidden="true" />
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2 mb-2 sm:mb-3 leading-relaxed">
              {bodyPreview}
            </p>

            {/* Metadata - Stacks better on mobile */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs text-muted-foreground">
              {/* Vote Count */}
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" aria-hidden="true" />
                <span className="font-medium">{item.voteCount}</span>
                <span className="hidden sm:inline">votes</span>
                <span className="sr-only">{item.voteCount} votes</span>
              </div>

              {/* Creation Date */}
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" aria-hidden="true" />
                <span className="truncate max-w-[100px] sm:max-w-none">{timeAgo}</span>
              </div>

              {/* Product Area */}
              {item.feature && (
                <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0" aria-label={`Product area: ${item.feature.area}`}>
                  {item.feature.area}
                </Badge>
              )}

              {/* State */}
              <Badge variant={stateBadgeVariant} className="text-[10px] sm:text-xs px-1.5 py-0" aria-label={`Status: ${formatState(item.state)}`}>
                {formatState(item.state)}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
});

/**
 * Empty state when no trending feedback is available
 */
function EmptyStateTrending() {
  return (
    <EmptyState
      icon={TrendingUp}
      title="No trending feedback yet"
      description="Be the first to submit feedback and get votes to see trending ideas here."
      actions={[
        {
          label: 'Submit Feedback',
          href: '/feedback/new',
          variant: 'default',
          icon: MessageSquare,
        },
        {
          label: 'Browse All',
          href: '/feedback',
          variant: 'outline',
        },
      ]}
      size="sm"
    />
  );
}

/**
 * Get badge variant based on feedback state
 */
function getStateBadgeVariant(state: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (state) {
    case 'new':
      return 'default';
    case 'triaged':
      return 'secondary';
    case 'in_roadmap':
      return 'default';
    case 'merged':
      return 'outline';
    case 'closed':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * Format state for display
 */
function formatState(state: string): string {
  switch (state) {
    case 'new':
      return 'New';
    case 'triaged':
      return 'Triaged';
    case 'in_roadmap':
      return 'In Roadmap';
    case 'merged':
      return 'Merged';
    case 'closed':
      return 'Closed';
    default:
      return state;
  }
}
