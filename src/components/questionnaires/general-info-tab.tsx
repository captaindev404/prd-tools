'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';

interface GeneralInfoTabProps {
  // Title state
  title: string;
  onTitleChange: (title: string) => void;
  titleError?: string | null;

  // Metadata (optional for create mode, required for edit mode)
  version?: string;
  status?: 'draft' | 'published' | 'closed';
  creatorName?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;

  // Accessibility
  titleInputRef?: React.RefObject<HTMLInputElement>;
}

export function GeneralInfoTab({
  title,
  onTitleChange,
  titleError,
  version = '1.0.0',
  status = 'draft',
  creatorName,
  createdAt,
  updatedAt,
  titleInputRef,
}: GeneralInfoTabProps) {
  // Character count validation
  const characterCount = title.length;
  const minChars = 3;
  const maxChars = 200;
  const isValid = characterCount >= minChars && characterCount <= maxChars;
  const showError = titleError || (title.length > 0 && !isValid);

  // Format dates
  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'N/A';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  // Status badge styling
  const getStatusBadgeVariant = (
    status: 'draft' | 'published' | 'closed'
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'published':
        return 'default'; // Green
      case 'draft':
        return 'secondary'; // Gray
      case 'closed':
        return 'destructive'; // Red
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Questionnaire Details</CardTitle>
          <CardDescription>
            Basic information about your questionnaire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="title">
                Title <span className="text-red-500" aria-label="required">*</span>
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Short, descriptive title that will be visible to users. Must be between 3-200 characters.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              ref={titleInputRef}
              id="title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g., Q4 2024 Guest Experience Survey"
              required
              maxLength={maxChars}
              className={showError ? 'border-red-500 focus-visible:ring-red-500' : ''}
              aria-describedby="title-description title-char-count title-error"
              aria-required="true"
              aria-invalid={showError ? 'true' : 'false'}
            />

            {/* Character Counter */}
            <div className="flex items-center justify-between">
              <p
                id="title-char-count"
                className={`text-xs ${
                  characterCount > maxChars
                    ? 'text-red-500 font-medium'
                    : characterCount >= maxChars * 0.9
                    ? 'text-yellow-600 dark:text-yellow-500'
                    : 'text-muted-foreground'
                }`}
                aria-live="polite"
              >
                {characterCount} / {maxChars} characters
                {characterCount < minChars && characterCount > 0 && (
                  <span className="ml-1 text-muted-foreground">
                    (minimum {minChars})
                  </span>
                )}
              </p>
            </div>

            {/* Validation Error */}
            {showError && (
              <p
                id="title-error"
                className="text-xs text-red-500"
                role="alert"
                aria-live="assertive"
              >
                {titleError ||
                  (characterCount < minChars
                    ? `Title must be at least ${minChars} characters`
                    : `Title must not exceed ${maxChars} characters`)}
              </p>
            )}

            <p id="title-description" className="sr-only">
              Enter a descriptive title for your questionnaire. Minimum {minChars} characters, maximum {maxChars} characters.
            </p>
          </div>

          {/* Metadata Section */}
          {(version || status || creatorName || createdAt || updatedAt) && (
            <div className="pt-4 border-t space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Metadata
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Version */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Version
                  </Label>
                  <div>
                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                      v{version}
                    </Badge>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Status
                  </Label>
                  <div>
                    <Badge variant={getStatusBadgeVariant(status)}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </div>
                </div>

                {/* Creator */}
                {creatorName && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Created By
                    </Label>
                    <p className="text-sm font-medium">{creatorName}</p>
                  </div>
                )}

                {/* Created Date */}
                {createdAt && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Created On
                    </Label>
                    <p className="text-sm font-medium">
                      {formatDate(createdAt)}
                    </p>
                  </div>
                )}

                {/* Updated Date */}
                {updatedAt && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Last Updated
                    </Label>
                    <p className="text-sm font-medium">
                      {formatDate(updatedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info Alert - Only show in create mode */}
          {!createdAt && (
            <Alert>
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>
                Questionnaires will be created in draft mode. You can publish them after reviewing all details.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
