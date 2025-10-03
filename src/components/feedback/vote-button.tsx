'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowBigUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface VoteButtonProps {
  feedbackId: string;
  initialVoteCount: number;
  initialTotalWeight: number;
  initialUserHasVoted: boolean;
  isAuthenticated: boolean;
  variant?: 'default' | 'compact';
  className?: string;
}

/**
 * VoteButton Component
 *
 * Handles voting on feedback items with optimistic UI updates.
 *
 * Features:
 * - Optimistic UI updates for immediate feedback
 * - Loading and error states
 * - Authentication check
 * - Vote/unvote toggle
 * - Displays vote count and total weight
 *
 * @param feedbackId - ID of the feedback item
 * @param initialVoteCount - Initial number of votes
 * @param initialTotalWeight - Initial total weight (with decay)
 * @param initialUserHasVoted - Whether the current user has voted
 * @param isAuthenticated - Whether the user is logged in
 * @param variant - Display variant ('default' or 'compact')
 * @param className - Additional CSS classes
 */
export function VoteButton({
  feedbackId,
  initialVoteCount,
  initialTotalWeight,
  initialUserHasVoted,
  isAuthenticated,
  variant = 'default',
  className,
}: VoteButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Optimistic state
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [totalWeight, setTotalWeight] = useState(initialTotalWeight);
  const [hasVoted, setHasVoted] = useState(initialUserHasVoted);
  const [isLoading, setIsLoading] = useState(false);

  const handleVote = async () => {
    // Check authentication
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to vote on feedback',
        variant: 'destructive',
      });
      return;
    }

    // Prevent double clicks
    if (isLoading || isPending) {
      return;
    }

    // Determine action (vote or unvote)
    const isVoting = !hasVoted;
    const endpoint = `/api/feedback/${feedbackId}/vote`;
    const method = isVoting ? 'POST' : 'DELETE';

    // Optimistic update
    const previousVoteCount = voteCount;
    const previousTotalWeight = totalWeight;
    const previousHasVoted = hasVoted;

    if (isVoting) {
      setVoteCount((prev) => prev + 1);
      // Estimate weight increase (will be corrected on response)
      setTotalWeight((prev) => prev + 1);
      setHasVoted(true);
    } else {
      setVoteCount((prev) => Math.max(0, prev - 1));
      // Estimate weight decrease (will be corrected on response)
      setTotalWeight((prev) => Math.max(0, prev - 1));
      setHasVoted(false);
    }

    setIsLoading(true);

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update vote');
      }

      if (method === 'POST') {
        // Get updated stats from response
        const data = await response.json();
        if (data.data?.stats) {
          setVoteCount(data.data.stats.count);
          setTotalWeight(data.data.stats.totalDecayedWeight);
        }

        toast({
          title: 'Vote recorded',
          description: 'Thank you for your feedback!',
        });
      } else {
        // For DELETE, response is 204 No Content
        toast({
          title: 'Vote removed',
          description: 'Your vote has been removed',
        });
      }

      // Refresh the page data in the background
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      // Revert optimistic update on error
      setVoteCount(previousVoteCount);
      setTotalWeight(previousTotalWeight);
      setHasVoted(previousHasVoted);

      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update vote',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'compact') {
    return (
      <Button
        size="sm"
        variant={hasVoted ? 'default' : 'outline'}
        onClick={handleVote}
        disabled={isLoading || isPending || !isAuthenticated}
        className={cn(
          'flex items-center gap-1 transition-all',
          hasVoted && 'bg-primary text-primary-foreground',
          className
        )}
        aria-label={hasVoted ? `Remove vote from feedback` : `Vote for feedback`}
      >
        <ArrowBigUp
          className={cn(
            'h-4 w-4 transition-transform',
            hasVoted && 'fill-current',
            isLoading && 'animate-pulse'
          )}
        />
        <span className="font-semibold">{voteCount}</span>
      </Button>
    );
  }

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <Button
        size="lg"
        variant={hasVoted ? 'default' : 'outline'}
        onClick={handleVote}
        disabled={isLoading || isPending || !isAuthenticated}
        className={cn(
          'flex flex-col items-center gap-1 h-auto py-3 px-4 transition-all',
          hasVoted && 'bg-primary text-primary-foreground shadow-md',
          !isAuthenticated && 'opacity-50 cursor-not-allowed'
        )}
        aria-label={hasVoted ? `Remove vote from feedback` : `Vote for feedback`}
      >
        <ArrowBigUp
          className={cn(
            'h-6 w-6 transition-transform',
            hasVoted && 'fill-current',
            isLoading && 'animate-pulse',
            hasVoted && !isLoading && 'scale-110'
          )}
        />
        <span className="text-2xl font-bold">{voteCount}</span>
        <span className="text-xs opacity-70">
          {hasVoted ? 'Voted' : 'Vote'}
        </span>
      </Button>
      {totalWeight !== voteCount && (
        <span className="text-xs text-muted-foreground">
          Weight: {totalWeight.toFixed(1)}
        </span>
      )}
    </div>
  );
}
