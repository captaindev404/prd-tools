'use client';

import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, X } from 'lucide-react';
import { DuplicateSuggestion } from '@/types/feedback';

interface DuplicateSuggestionsProps {
  suggestions: DuplicateSuggestion[];
  onDismiss: () => void;
}

export function DuplicateSuggestions({ suggestions, onDismiss }: DuplicateSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <Alert className="relative">
      <AlertCircle className="h-4 w-4" />
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-6 w-6"
        onClick={onDismiss}
        aria-label="Dismiss duplicate suggestions"
      >
        <X className="h-4 w-4" />
      </Button>
      <AlertTitle>Similar feedback found</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm">
          We found {suggestions.length} similar {suggestions.length === 1 ? 'item' : 'items'}.
          Consider voting on existing feedback instead of creating a duplicate.
        </p>
        <div className="space-y-2">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="flex items-start gap-3 rounded-md border bg-background/50 p-3"
            >
              <div className="flex-1 min-w-0">
                <Link
                  href={`/feedback/${suggestion.id}`}
                  className="font-medium hover:underline line-clamp-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {suggestion.title}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {suggestion.voteCount} {suggestion.voteCount === 1 ? 'vote' : 'votes'}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(suggestion.similarity * 100)}% similar
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}
