'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VoteButton } from '@/components/feedback/vote-button';
import { FeedbackListItem } from '@/types/feedback';
import { formatDistanceToNow } from '@/lib/utils';

interface FeedbackCardProps {
  feedback: FeedbackListItem & {
    totalWeight?: number;
    userHasVoted?: boolean;
  };
  isAuthenticated: boolean;
}

const stateColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  triaged: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  merged: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  in_roadmap: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

const stateLabels: Record<string, string> = {
  new: 'New',
  triaged: 'Triaged',
  merged: 'Merged',
  in_roadmap: 'In Roadmap',
  closed: 'Closed',
};

export function FeedbackCard({ feedback, isAuthenticated }: FeedbackCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Link
              href={`/feedback/${feedback.id}`}
              className="text-lg font-semibold hover:text-primary transition-colors line-clamp-2"
            >
              {feedback.title}
            </Link>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
              <span>by {feedback.author.displayName}</span>
              <span className="text-muted-foreground/50">•</span>
              <time dateTime={feedback.createdAt}>
                {formatDistanceToNow(feedback.createdAt)}
              </time>
              {feedback.productArea && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="font-medium text-foreground">{feedback.productArea}</span>
                </>
              )}
            </div>
          </div>
          <Badge className={stateColors[feedback.state]} variant="secondary">
            {stateLabels[feedback.state]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <VoteButton
          feedbackId={feedback.id}
          initialVoteCount={feedback.voteCount}
          initialTotalWeight={feedback.totalWeight || feedback.voteWeight}
          initialUserHasVoted={feedback.userHasVoted || false}
          isAuthenticated={isAuthenticated}
          variant="compact"
        />
      </CardContent>
    </Card>
  );
}
