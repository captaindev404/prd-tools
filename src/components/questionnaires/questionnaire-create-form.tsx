'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { FormSkeleton } from '@/components/research/FormSkeleton';
import { QuestionBuilder, Question } from './question-builder';
import { QuestionnairePreviewModal } from './questionnaire-preview-modal';
import { QuestionnairePublishDialog } from './questionnaire-publish-dialog';
import { GeneralInfoTab } from './general-info-tab';
import { AlertCircle, Save, Loader2, Send, Users, Eye, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAutosave } from '@/hooks/use-autosave';
import { AutosaveIndicator } from './AutosaveIndicator';
import { addRecentPanels } from '@/lib/recent-panels-storage';

interface Panel {
  id: string;
  name: string;
  description: string | null;
  _count: {
    memberships: number;
  };
}

interface QuestionnaireCreateFormProps {
  availablePanels: Panel[];
}

export function QuestionnaireCreateForm({
  availablePanels,
}: QuestionnaireCreateFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAction, setSubmitAction] = useState<'draft' | 'publish' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Optimistic UI state
  const [isOptimistic, setIsOptimistic] = useState(false);
  const [optimisticSuccess, setOptimisticSuccess] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [targetingType, setTargetingType] = useState('all_users');
  const [selectedPanels, setSelectedPanels] = useState<string[]>([]);
  const [anonymous, setAnonymous] = useState(false);
  const [responseLimit, setResponseLimit] = useState('unlimited');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [maxResponses, setMaxResponses] = useState<string | number>('');

  // Audience size calculation
  const [estimatedReach, setEstimatedReach] = useState<number | null>(null);
  const [isLoadingReach, setIsLoadingReach] = useState(false);
  const [reachError, setReachError] = useState<string | null>(null);

  // Preview modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Publish confirmation dialog state
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);

  // Current tab state for navigation
  const [currentTab, setCurrentTab] = useState('general');

  // Draft ID tracking (once created, we update instead of create)
  const [draftId, setDraftId] = useState<string | null>(null);

  // Accessibility refs
  const errorRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const validateForm = (): string | null => {
    // Title validation
    if (!title.trim()) {
      return 'Title is required';
    }
    if (title.trim().length < 3) {
      return 'Title must be at least 3 characters';
    }
    if (title.length > 200) {
      return 'Title must not exceed 200 characters';
    }

    // Questions validation
    if (questions.length === 0) {
      return 'At least one question is required';
    }

    // Check all questions have text
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q) continue;
      if (!q.text.trim()) {
        return `Question ${i + 1} must have text`;
      }
      // MCQ validation
      if ((q.type === 'mcq_single' || q.type === 'mcq_multiple') && (!q.config?.options || q.config.options.length < 2)) {
        return `Question ${i + 1} (Multiple Choice) must have at least 2 options`;
      }
    }

    // Targeting validation
    if (targetingType === 'specific_panels' && selectedPanels.length === 0) {
      return 'At least one panel must be selected when targeting specific panels';
    }

    // Date validation
    if (startAt && endAt) {
      const startDate = new Date(startAt);
      const endDate = new Date(endAt);
      if (startDate >= endDate) {
        return 'End date must be after start date';
      }
    }

    // Max responses validation
    if (maxResponses && Number(maxResponses) <= 0) {
      return 'Maximum responses must be a positive number';
    }

    return null;
  };

  // Tab completion validation functions
  const isGeneralInfoComplete = (): boolean => {
    return title.trim().length >= 3 && title.length <= 200;
  };

  const isQuestionsComplete = (): boolean => {
    return questions.length >= 1 && questions.every(q => q.text.trim().length > 0);
  };

  const isTargetingComplete = (): boolean => {
    if (targetingType === 'all_users') return true;
    if (targetingType === 'specific_panels') return selectedPanels.length > 0;
    // For villages and roles, we'll consider them complete if selected
    // In the future, when these are implemented, add similar logic
    return true;
  };

  const isResponseSettingsComplete = (): boolean => {
    // All settings have defaults, so always valid
    // Check that dates are valid if provided
    if (startAt && endAt) {
      const startDate = new Date(startAt);
      const endDate = new Date(endAt);
      return startDate < endDate;
    }
    return true;
  };

  // Calculate overall progress
  const calculateProgress = (): { completed: number; total: number; percentage: number } => {
    const completionStates = [
      isGeneralInfoComplete(),
      isQuestionsComplete(),
      isTargetingComplete(),
      isResponseSettingsComplete(),
    ];

    const completed = completionStates.filter(Boolean).length;
    const total = completionStates.length;
    const percentage = (completed / total) * 100;

    return { completed, total, percentage };
  };

  const progress = calculateProgress();

  const handleSubmit = async (action: 'draft' | 'publish') => {
    setError(null);
    setSubmitAction(action);

    // Validation
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setSubmitAction(null);
      // Focus on error for screen readers
      setTimeout(() => {
        errorRef.current?.focus();
      }, 100);
      return;
    }

    setIsSubmitting(true);

    // Enable optimistic UI for publish action
    if (action === 'publish') {
      setIsOptimistic(true);
      // Show success state immediately after a short delay
      setTimeout(() => {
        setOptimisticSuccess(true);
      }, 300);
    }

    try {
      // Transform questions to match API format
      const transformedQuestions = questions.map((q, index) => ({
        id: q.id,
        type: q.type,
        text: q.text,
        required: q.required,
        order: index,
        config: q.config,
      }));

      const createData = {
        title: title.trim(),
        questions: transformedQuestions,
        targeting: {
          type: targetingType,
          panelIds: targetingType === 'specific_panels' ? selectedPanels : [],
          villageIds: [], // Can be extended later
          roles: [], // Can be extended later
        },
        anonymous,
        responseLimit: responseLimit === 'unlimited' ? 0 : parseInt(responseLimit, 10),
        startAt: startAt ? new Date(startAt).toISOString() : null,
        endAt: endAt ? new Date(endAt).toISOString() : null,
        maxResponses: maxResponses ? Number(maxResponses) : null,
      };

      // Create questionnaire
      const response = await fetch('/api/questionnaires', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create questionnaire');
      }

      const questionnaireId = data.data.id;

      // If action is 'publish', publish immediately
      if (action === 'publish') {
        const publishResponse = await fetch(`/api/questionnaires/${questionnaireId}/publish`, {
          method: 'POST',
        });

        const publishData = await publishResponse.json();

        if (!publishResponse.ok) {
          // Rollback optimistic state
          setIsOptimistic(false);
          setOptimisticSuccess(false);

          // If publish fails, questionnaire is still created as draft
          const errorMessage = `Questionnaire created as draft, but failed to publish: ${
            publishData.message || 'Unknown error'
          }`;
          setError(errorMessage);
          setIsSubmitting(false);
          setSubmitAction(null);

          // Show error toast
          toast({
            title: 'Publish Failed',
            description: errorMessage,
            variant: 'destructive',
          });

          // Still redirect to the questionnaire analytics page (saved as draft)
          router.push(`/research/questionnaires/${questionnaireId}/analytics`);
          router.refresh();
          return;
        }

        // Save recently used panels for quick access next time
        if (targetingType === 'specific_panels' && selectedPanels.length > 0) {
          addRecentPanels(selectedPanels);
        }

        // Show success toast for publish with reach count
        const reachCount = estimatedReach ?? 0;
        toast({
          title: 'Questionnaire Published',
          description: `Successfully published to ${reachCount.toLocaleString()} ${reachCount === 1 ? 'user' : 'users'}.`,
        });

        // Redirect to analytics page for published questionnaires
        router.push(`/research/questionnaires/${questionnaireId}/analytics`);
        router.refresh();
        return;
      } else {
        // Show success toast for draft
        toast({
          title: 'Draft Saved',
          description: 'Questionnaire saved as draft successfully.',
        });
      }

      // Success - redirect to questionnaire analytics page
      router.push(`/research/questionnaires/${questionnaireId}/analytics`);
      router.refresh();
    } catch (err) {
      // Rollback optimistic UI on error
      setIsOptimistic(false);
      setOptimisticSuccess(false);

      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setIsSubmitting(false);
      setSubmitAction(null);

      // Show error toast
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handlePanelToggle = (panelId: string, checked: boolean) => {
    if (checked) {
      setSelectedPanels([...selectedPanels, panelId]);
    } else {
      setSelectedPanels(selectedPanels.filter(id => id !== panelId));
    }
  };

  // Debounced audience size calculation - prevents excessive API calls
  const debouncedCalculateAudienceSize = useCallback(
    (targetingTypeParam: string, selectedPanelsParam: string[]) => {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set loading state immediately
      setIsLoadingReach(true);
      setReachError(null);

      // Debounce the actual calculation
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const requestBody: any = {
            targetingType: targetingTypeParam,
          };

          // Add targeting-specific parameters
          if (targetingTypeParam === 'specific_panels') {
            if (selectedPanelsParam.length === 0) {
              setEstimatedReach(0);
              setIsLoadingReach(false);
              return;
            }
            requestBody.panelIds = selectedPanelsParam;
          }

          const response = await fetch('/api/questionnaires/audience-stats', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to calculate audience size');
          }

          setEstimatedReach(data.estimatedReach);
        } catch (err) {
          console.error('Error calculating audience size:', err);
          setReachError(err instanceof Error ? err.message : 'Failed to calculate audience size');
          setEstimatedReach(null);
        } finally {
          setIsLoadingReach(false);
        }
      }, 500); // 500ms debounce delay
    },
    []
  );

  // Calculate estimated audience size when targeting changes (debounced)
  useEffect(() => {
    debouncedCalculateAudienceSize(targetingType, selectedPanels);

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [targetingType, selectedPanels, debouncedCalculateAudienceSize]);

  // Keyboard shortcuts handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // Ctrl/Cmd + Enter to save as draft
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isSubmitting) {
      e.preventDefault();
      handleSubmit('draft');
    }
    // Escape to cancel (go back)
    if (e.key === 'Escape' && !isSubmitting && !isPreviewOpen) {
      e.preventDefault();
      router.back();
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={(e) => e.preventDefault()}
      onKeyDown={handleKeyDown}
      className="space-y-6"
      aria-label="Create questionnaire form"
    >
      {error && (
        <Alert
          variant="destructive"
          role="alert"
          aria-live="assertive"
          ref={errorRef}
          tabIndex={-1}
          className="transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-top-2"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Optimistic success state */}
      {optimisticSuccess && !error && (
        <Alert
          className="border-green-200 bg-green-50 text-green-800 transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-top-2"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
          <AlertDescription className="flex items-center gap-2">
            <span>Questionnaire published successfully!</span>
            <LoadingSpinner size="sm" variant="default" />
            <span className="text-xs text-muted-foreground">Redirecting...</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Screen reader announcements for loading/submitting states */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isSubmitting && submitAction === 'draft' && 'Saving questionnaire as draft...'}
        {isSubmitting && submitAction === 'publish' && 'Publishing questionnaire...'}
        {isLoadingReach && 'Calculating audience size...'}
        {optimisticSuccess && 'Questionnaire published successfully. Redirecting...'}
      </div>

      {/* Progress Indicator */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-6 pb-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Form Completion</span>
              <span className="font-semibold text-foreground">
                {progress.completed}/{progress.total} sections completed ({Math.round(progress.percentage)}%)
              </span>
            </div>
            <Progress
              value={progress.percentage}
              className="h-2.5"
              aria-label={`Form ${Math.round(progress.percentage)}% complete`}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs pt-2">
              <div className="flex items-center gap-1.5">
                {isGeneralInfoComplete() ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" aria-label="complete" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/40 flex-shrink-0" aria-label="incomplete" />
                )}
                <span className={isGeneralInfoComplete() ? 'text-green-700 font-medium' : 'text-muted-foreground'}>
                  General Info
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {isQuestionsComplete() ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" aria-label="complete" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/40 flex-shrink-0" aria-label="incomplete" />
                )}
                <span className={isQuestionsComplete() ? 'text-green-700 font-medium' : 'text-muted-foreground'}>
                  Questions
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {isTargetingComplete() ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" aria-label="complete" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/40 flex-shrink-0" aria-label="incomplete" />
                )}
                <span className={isTargetingComplete() ? 'text-green-700 font-medium' : 'text-muted-foreground'}>
                  Targeting
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {isResponseSettingsComplete() ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" aria-label="complete" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/40 flex-shrink-0" aria-label="incomplete" />
                )}
                <span className={isResponseSettingsComplete() ? 'text-green-700 font-medium' : 'text-muted-foreground'}>
                  Settings
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="gap-2">
            General Info
            {isGeneralInfoComplete() ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="complete" />
            ) : (
              <AlertCircle className="h-4 w-4 text-muted-foreground" aria-label="incomplete" />
            )}
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-2">
            Questions
            {isQuestionsComplete() ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="complete" />
            ) : (
              <AlertCircle className="h-4 w-4 text-muted-foreground" aria-label="incomplete" />
            )}
          </TabsTrigger>
          <TabsTrigger value="targeting" className="gap-2">
            Targeting & Settings
            {isTargetingComplete() && isResponseSettingsComplete() ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="complete" />
            ) : (
              <AlertCircle className="h-4 w-4 text-muted-foreground" aria-label="incomplete" />
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: General Info */}
        <TabsContent value="general" className="space-y-4">
          <GeneralInfoTab
            title={title}
            onTitleChange={setTitle}
            titleError={error?.includes('Title') ? error : null}
            titleInputRef={titleInputRef}
          />
        </TabsContent>

        {/* Tab 2: Questions */}
        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Build Your Questions</CardTitle>
              <CardDescription>
                Add and configure questions for your questionnaire.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuestionBuilder questions={questions} onChange={setQuestions} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Targeting & Settings */}
        <TabsContent value="targeting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audience Targeting</CardTitle>
              <CardDescription>
                Define who can see and respond to this questionnaire
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="targetingType">
                  Target Audience <span className="text-red-500" aria-label="required">*</span>
                </Label>
                <Select value={targetingType} onValueChange={setTargetingType}>
                  <SelectTrigger
                    id="targetingType"
                    aria-label="Select target audience"
                    aria-required="true"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_users">All Users</SelectItem>
                    <SelectItem value="specific_panels">Specific Panels</SelectItem>
                    <SelectItem value="specific_villages">Specific Villages</SelectItem>
                    <SelectItem value="by_role">By Role</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {targetingType === 'specific_panels' && (
                <div className="space-y-3 transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-top-2">
                  <Label>
                    Select Panels <span className="text-red-500" aria-label="required">*</span>
                  </Label>
                  {availablePanels.length === 0 ? (
                    <Alert role="status">
                      <AlertCircle className="h-4 w-4" aria-hidden="true" />
                      <AlertDescription>
                        No panels available. Create a panel first to target specific user groups.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div
                      className="space-y-2 border rounded-lg p-4"
                      role="group"
                      aria-label="Select panels for targeting"
                    >
                      {availablePanels.map((panel) => (
                        <div key={panel.id} className="flex items-start space-x-2 transition-colors duration-150 hover:bg-accent/50 rounded p-1">
                          <Checkbox
                            id={`panel-${panel.id}`}
                            checked={selectedPanels.includes(panel.id)}
                            onCheckedChange={(checked) => handlePanelToggle(panel.id, !!checked)}
                            aria-describedby={`panel-${panel.id}-description`}
                            disabled={isSubmitting}
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={`panel-${panel.id}`}
                              className="font-medium cursor-pointer"
                            >
                              {panel.name}
                            </Label>
                            <p
                              id={`panel-${panel.id}-description`}
                              className="text-xs text-muted-foreground"
                            >
                              {panel.description && `${panel.description}. `}
                              {panel._count.memberships} {panel._count.memberships === 1 ? 'member' : 'members'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Estimated Audience Reach */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  <div className="flex-1">
                    {isLoadingReach ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground transition-all duration-200 animate-in fade-in">
                        <LoadingSpinner size="sm" variant="muted" />
                        <span>Calculating audience size...</span>
                      </div>
                    ) : reachError ? (
                      <div className="text-sm text-destructive transition-all duration-200 animate-in fade-in">
                        {reachError}
                      </div>
                    ) : estimatedReach !== null ? (
                      <div className="space-y-1 transition-all duration-300 animate-in fade-in slide-in-from-left-2">
                        <p className="text-sm text-muted-foreground">
                          Estimated reach:{' '}
                          <span className="font-semibold text-foreground text-base">
                            {estimatedReach.toLocaleString()}
                          </span>{' '}
                          {estimatedReach === 1 ? 'user' : 'users'}
                        </p>
                        {targetingType === 'specific_panels' && selectedPanels.length > 1 && (
                          <p className="text-xs text-muted-foreground">
                            Users may belong to multiple panels and are counted once
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Select targeting options to see estimated reach
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Settings</CardTitle>
              <CardDescription>
                Configure how responses are collected
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymous"
                  checked={anonymous}
                  onCheckedChange={(checked) => setAnonymous(!!checked)}
                />
                <Label htmlFor="anonymous" className="cursor-pointer">
                  Allow anonymous responses
                </Label>
              </div>

              <div>
                <Label htmlFor="responseLimit">Response Limit per User</Label>
                <Select value={responseLimit} onValueChange={setResponseLimit}>
                  <SelectTrigger id="responseLimit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                    <SelectItem value="1">Once only</SelectItem>
                    <SelectItem value="7">Once per week</SelectItem>
                    <SelectItem value="30">Once per month</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  How many times each user can respond
                </p>
              </div>

              <div>
                <Label htmlFor="startAt">Start Date (optional)</Label>
                <Input
                  id="startAt"
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  When the questionnaire becomes available. Leave empty to start immediately upon publishing.
                </p>
              </div>

              <div>
                <Label htmlFor="endAt">End Date (optional)</Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  When the questionnaire closes. Leave empty for no end date.
                </p>
              </div>

              <div>
                <Label htmlFor="maxResponses">Maximum Total Responses (optional)</Label>
                <Input
                  id="maxResponses"
                  type="number"
                  min="1"
                  value={maxResponses}
                  onChange={(e) => setMaxResponses(e.target.value)}
                  placeholder="No limit"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Questionnaire will close after this many responses
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between border-t pt-6">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="transition-all duration-200"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsPreviewOpen(true)}
            disabled={isSubmitting || questions.length === 0}
            className="transition-all duration-200"
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit('draft')}
            disabled={isSubmitting}
            className="transition-all duration-200 min-w-[140px]"
          >
            {isSubmitting && submitAction === 'draft' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Draft...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </>
            )}
          </Button>
          <Button
            type="button"
            onClick={() => setIsPublishDialogOpen(true)}
            disabled={isSubmitting || validateForm() !== null || isOptimistic}
            className="transition-all duration-200 min-w-[160px]"
          >
            {isSubmitting && submitAction === 'publish' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : optimisticSuccess ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Published!
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Save & Publish
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Preview Modal */}
      <QuestionnairePreviewModal
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={title}
        questions={questions}
      />

      {/* Publish Confirmation Dialog */}
      <QuestionnairePublishDialog
        open={isPublishDialogOpen}
        onOpenChange={setIsPublishDialogOpen}
        onConfirm={() => handleSubmit('publish')}
        title={title}
        questions={questions}
        targetingType={targetingType}
        selectedPanels={selectedPanels}
        isSubmitting={isSubmitting && submitAction === 'publish'}
        estimatedReach={estimatedReach}
      />
    </form>
  );
}
