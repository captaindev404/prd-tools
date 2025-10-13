'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarIcon, AlertCircle, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface ResponseSettings {
  anonymous: boolean;
  responseLimit: 'once' | 'daily' | 'weekly' | 'unlimited';
  startAt: Date | null;
  endAt: Date | null;
  maxTotalResponses: number | null;
}

interface ResponseSettingsTabProps {
  settings: ResponseSettings;
  onChange: (settings: ResponseSettings) => void;
  errors?: {
    startAt?: string;
    endAt?: string;
    maxTotalResponses?: string;
  };
}

export function ResponseSettingsTab({ settings, onChange, errors = {} }: ResponseSettingsTabProps) {
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const handleAnonymousChange = (checked: boolean) => {
    onChange({ ...settings, anonymous: checked });
  };

  const handleResponseLimitChange = (value: string) => {
    onChange({
      ...settings,
      responseLimit: value as 'once' | 'daily' | 'weekly' | 'unlimited'
    });
  };

  const handleStartAtChange = (date: Date | Date[] | { from: Date; to: Date } | undefined) => {
    // For single mode, only Date or undefined is passed
    const selectedDate = date instanceof Date ? date : undefined;
    onChange({ ...settings, startAt: selectedDate || null });
    setStartDateOpen(false);
  };

  const handleEndAtChange = (date: Date | Date[] | { from: Date; to: Date } | undefined) => {
    // For single mode, only Date or undefined is passed
    const selectedDate = date instanceof Date ? date : undefined;
    onChange({ ...settings, endAt: selectedDate || null });
    setEndDateOpen(false);
  };

  const handleMaxResponsesChange = (value: string) => {
    const numValue = value === '' ? null : parseInt(value, 10);
    onChange({ ...settings, maxTotalResponses: numValue });
  };

  // Date validation
  const getDateValidationError = (): string | null => {
    if (settings.startAt && settings.endAt) {
      if (settings.startAt >= settings.endAt) {
        return 'End date must be after start date';
      }
    }
    return null;
  };

  const dateError = getDateValidationError();

  return (
    <div className="space-y-6">
      {/* Anonymous Responses */}
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="anonymous"
            checked={settings.anonymous}
            onCheckedChange={handleAnonymousChange}
            aria-describedby="anonymous-description"
          />
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Label htmlFor="anonymous" className="cursor-pointer font-medium">
                Allow anonymous responses
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>When enabled, respondent identities are not recorded. Use for sensitive topics where anonymity encourages honest feedback.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p
              id="anonymous-description"
              className="text-sm text-muted-foreground"
            >
              When enabled, respondent names will not be recorded. Only aggregated data will be available.
            </p>
          </div>
        </div>
      </div>

      {/* Response Limit per User */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="responseLimit">
            Response Limit per User
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Control how often users can respond:</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Once: One response per user</li>
                  <li>Daily: One response per day</li>
                  <li>Weekly: One response per week</li>
                  <li>Unlimited: No limit</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Select
          value={settings.responseLimit}
          onValueChange={handleResponseLimitChange}
        >
          <SelectTrigger
            id="responseLimit"
            aria-describedby="responseLimit-description"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="once">
              Once only
            </SelectItem>
            <SelectItem value="daily">
              Daily
            </SelectItem>
            <SelectItem value="weekly">
              Weekly
            </SelectItem>
            <SelectItem value="unlimited">
              Unlimited
            </SelectItem>
          </SelectContent>
        </Select>
        <p
          id="responseLimit-description"
          className="text-xs text-muted-foreground"
        >
          {settings.responseLimit === 'once' && 'Users can respond only once to this questionnaire'}
          {settings.responseLimit === 'daily' && 'Users can respond once per day'}
          {settings.responseLimit === 'weekly' && 'Users can respond once per week'}
          {settings.responseLimit === 'unlimited' && 'Users can respond multiple times without restrictions'}
        </p>
      </div>

      {/* Schedule Settings */}
      <div className="space-y-4 pt-4 border-t">
        <div>
          <h4 className="text-sm font-medium mb-3">Schedule</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Set when the questionnaire becomes available and when it closes
          </p>
        </div>

        {dateError && (
          <Alert variant="destructive" role="alert">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>{dateError}</AlertDescription>
          </Alert>
        )}

        {/* Start Date */}
        <div className="space-y-2">
          <Label htmlFor="startAt">
            Start Date
          </Label>
          <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
            <PopoverTrigger asChild>
              <Button
                id="startAt"
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !settings.startAt && 'text-muted-foreground'
                )}
                aria-describedby="startAt-description"
                aria-label={settings.startAt ? `Start date: ${format(settings.startAt, 'PPP')}` : 'Select start date'}
              >
                <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                {settings.startAt ? (
                  format(settings.startAt, 'PPP')
                ) : (
                  <span>Start immediately upon publishing</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={settings.startAt || undefined}
                onSelect={handleStartAtChange}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>
          <p
            id="startAt-description"
            className="text-xs text-muted-foreground"
          >
            When the questionnaire becomes available. Defaults to now when published.
          </p>
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label htmlFor="endAt">
            End Date (Optional)
          </Label>
          <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
            <PopoverTrigger asChild>
              <Button
                id="endAt"
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !settings.endAt && 'text-muted-foreground'
                )}
                aria-describedby="endAt-description"
                aria-label={settings.endAt ? `End date: ${format(settings.endAt, 'PPP')}` : 'Select end date'}
              >
                <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                {settings.endAt ? (
                  format(settings.endAt, 'PPP')
                ) : (
                  <span>No end date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={settings.endAt || undefined}
                onSelect={handleEndAtChange}
                disabled={(date) => {
                  const today = new Date(new Date().setHours(0, 0, 0, 0));
                  if (date < today) return true;
                  if (settings.startAt && date <= settings.startAt) return true;
                  return false;
                }}
              />
            </PopoverContent>
          </Popover>
          <p
            id="endAt-description"
            className="text-xs text-muted-foreground"
          >
            When the questionnaire closes. Leave empty for no end date.
          </p>
        </div>
      </div>

      {/* Maximum Total Responses */}
      <div className="space-y-2 pt-4 border-t">
        <div className="flex items-center gap-2">
          <Label htmlFor="maxTotalResponses">
            Maximum Total Responses (Optional)
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Stop accepting responses after this many total submissions. Leave empty for unlimited. Useful for limiting sample size or managing response volume.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Input
          id="maxTotalResponses"
          type="number"
          min="1"
          step="1"
          value={settings.maxTotalResponses ?? ''}
          onChange={(e) => handleMaxResponsesChange(e.target.value)}
          placeholder="No limit"
          aria-describedby="maxTotalResponses-description"
          aria-invalid={!!errors.maxTotalResponses}
        />
        <p
          id="maxTotalResponses-description"
          className="text-xs text-muted-foreground"
        >
          Leave empty for unlimited responses. The questionnaire will automatically close after reaching this number.
        </p>
        {errors.maxTotalResponses && (
          <p className="text-xs text-destructive" role="alert">
            {errors.maxTotalResponses}
          </p>
        )}
      </div>

      {/* Summary Info */}
      <div className="space-y-2 p-4 bg-muted/50 rounded-lg mt-6">
        <h4 className="text-sm font-medium">Settings Summary</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            <span className="font-medium">Anonymity:</span>{' '}
            {settings.anonymous ? 'Anonymous responses enabled' : 'Responses will include user names'}
          </li>
          <li>
            <span className="font-medium">Response limit:</span>{' '}
            {settings.responseLimit === 'once' && 'Once per user'}
            {settings.responseLimit === 'daily' && 'Once per day per user'}
            {settings.responseLimit === 'weekly' && 'Once per week per user'}
            {settings.responseLimit === 'unlimited' && 'Unlimited per user'}
          </li>
          <li>
            <span className="font-medium">Active period:</span>{' '}
            {settings.startAt ? format(settings.startAt, 'PPP') : 'Immediately upon publishing'}
            {' → '}
            {settings.endAt ? format(settings.endAt, 'PPP') : 'No end date'}
          </li>
          {settings.maxTotalResponses && (
            <li>
              <span className="font-medium">Total responses cap:</span>{' '}
              {settings.maxTotalResponses.toLocaleString()} responses
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
