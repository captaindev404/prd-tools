'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { QuestionBuilder, Question } from './question-builder';
import { QuestionnairePreviewModal } from './questionnaire-preview-modal';
import { QuestionnairePublishDialog } from './questionnaire-publish-dialog';
import { FormErrorAlert, FieldError } from './FormErrorAlert';
import { apiRequest, mapApiErrorsToFields, type ApiError } from '@/lib/api/error-handler';
import { AlertCircle, Save, Loader2, Send, Users, Eye } from 'lucide-react';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAction, setSubmitAction] = useState<'draft' | 'publish' | null>(null);

  // Comprehensive error state
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

  // Accessibility refs
  const errorRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear field errors when user modifies a field
  const clearFieldError = (fieldName: string) => {
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  // Client-side validation
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

  // Handle form submission with comprehensive error handling
  const handleSubmit = async (action: 'draft' | 'publish') => {
    // Clear previous errors
    setApiError(null);
    setFieldErrors({});
    setSubmitAction(action);

    // Client-side validation
    const validationError = validateForm();
    if (validationError) {
      setApiError({
        type: 'validation',
        message: validationError,
        retryable: true,
      });
      setSubmitAction(null);
      return;
    }

    setIsSubmitting(true);

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
          villageIds: [],
          roles: [],
        },
        anonymous,
        responseLimit: responseLimit === 'unlimited' ? 0 : parseInt(responseLimit, 10),
        startAt: startAt ? new Date(startAt).toISOString() : null,
        endAt: endAt ? new Date(endAt).toISOString() : null,
        maxResponses: maxResponses ? Number(maxResponses) : null,
      };

      // Create questionnaire with error handling
      const result = await apiRequest<any>(
        '/api/questionnaires',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createData),
        },
        {
          enableLogging: true,
          onAuthError: (returnUrl) => {
            // Redirect to login with return URL
            router.push(`/auth/signin?callbackUrl=${encodeURIComponent(returnUrl)}`);
          },
          onNetworkError: () => {
            // Optional: Show a toast notification
            console.warn('Network error detected');
          },
        }
      );

      // Handle errors
      if (result.error) {
        setApiError(result.error);

        // Map field-level validation errors
        if (result.error.type === 'validation' && result.error.details) {
          const mappedErrors = mapApiErrorsToFields(result.error.details);
          setFieldErrors(mappedErrors);
        }

        setIsSubmitting(false);
        setSubmitAction(null);
        return;
      }

      const questionnaireId = result.data.id;

      // If action is 'publish', publish immediately
      if (action === 'publish') {
        const publishResult = await apiRequest<any>(
          `/api/questionnaires/${questionnaireId}/publish`,
          {
            method: 'POST',
          },
          {
            enableLogging: true,
          }
        );

        if (publishResult.error) {
          // If publish fails, questionnaire is still created as draft
          setApiError({
            type: 'server',
            message: `Questionnaire created as draft, but failed to publish: ${publishResult.error.message}`,
            retryable: true,
          });
          setIsSubmitting(false);
          setSubmitAction(null);
          // Still redirect to the questionnaire
          router.push(`/research/questionnaires/${questionnaireId}`);
          router.refresh();
          return;
        }
      }

      // Success - redirect to questionnaire detail page
      router.push(`/research/questionnaires/${questionnaireId}`);
      router.refresh();
    } catch (err) {
      // Unexpected errors
      setApiError({
        type: 'unknown',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
        retryable: false,
      });
      setIsSubmitting(false);
      setSubmitAction(null);
    }
  };

  // Retry handler
  const handleRetry = () => {
    if (submitAction) {
      handleSubmit(submitAction);
    }
  };

  // Dismiss error handler
  const handleDismissError = () => {
    setApiError(null);
    setFieldErrors({});
  };

  const handlePanelToggle = (panelId: string, checked: boolean) => {
    if (checked) {
      setSelectedPanels([...selectedPanels, panelId]);
    } else {
      setSelectedPanels(selectedPanels.filter(id => id !== panelId));
    }
  };

  // Calculate estimated audience size when targeting changes
  useEffect(() => {
    const calculateAudienceSize = async () => {
      setReachError(null);
      setIsLoadingReach(true);

      try {
        const requestBody: any = {
          targetingType,
        };

        // Add targeting-specific parameters
        if (targetingType === 'specific_panels') {
          if (selectedPanels.length === 0) {
            setEstimatedReach(0);
            setIsLoadingReach(false);
            return;
          }
          requestBody.panelIds = selectedPanels;
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
    };

    calculateAudienceSize();
  }, [targetingType, selectedPanels]);

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
      {/* Comprehensive Error Display */}
      <FormErrorAlert
        error={apiError}
        onRetry={handleRetry}
        onDismiss={handleDismissError}
      />

      {/* Screen reader announcements for loading/submitting states */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isSubmitting && submitAction === 'draft' && 'Saving questionnaire as draft...'}
        {isSubmitting && submitAction === 'publish' && 'Publishing questionnaire...'}
        {isLoadingReach && 'Calculating audience size...'}
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General Info</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="targeting">Targeting & Settings</TabsTrigger>
        </TabsList>

        {/* Tab 1: General Info */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Questionnaire Details</CardTitle>
              <CardDescription>
                Basic information about your questionnaire
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">
                  Title <span className="text-red-500" aria-label="required">*</span>
                </Label>
                <Input
                  ref={titleInputRef}
                  id="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    clearFieldError('title');
                  }}
                  placeholder="e.g., Q4 2024 Guest Experience Survey"
                  required
                  maxLength={200}
                  aria-describedby="title-description title-char-count title-error"
                  aria-required="true"
                  aria-invalid={!!fieldErrors.title}
                  className={fieldErrors.title ? 'border-destructive' : ''}
                />
                <p id="title-char-count" className="text-xs text-muted-foreground mt-1">
                  {title.length} of 200 characters used
                </p>
                <FieldError error={fieldErrors.title} fieldId="title" />
                <p id="title-description" className="sr-only">
                  Enter a descriptive title for your questionnaire. Maximum 200 characters.
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>
                  Questionnaires will be created in draft mode. You can publish them after reviewing all details.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
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
              <QuestionBuilder
                questions={questions}
                onChange={(newQuestions) => {
                  setQuestions(newQuestions);
                  clearFieldError('questions');
                }}
              />
              <FieldError error={fieldErrors.questions} fieldId="questions" />
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
                <div className="space-y-3">
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
                        <div key={panel.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={`panel-${panel.id}`}
                            checked={selectedPanels.includes(panel.id)}
                            onCheckedChange={(checked) => handlePanelToggle(panel.id, !!checked)}
                            aria-describedby={`panel-${panel.id}-description`}
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
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    {isLoadingReach ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Calculating audience size...</span>
                      </div>
                    ) : reachError ? (
                      <div className="text-sm text-destructive">
                        {reachError}
                      </div>
                    ) : estimatedReach !== null ? (
                      <div className="space-y-1">
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
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsPreviewOpen(true)}
            disabled={isSubmitting || questions.length === 0}
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
            disabled={isSubmitting}
          >
            {isSubmitting && submitAction === 'publish' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing...
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
