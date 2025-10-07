'use client';

import { useState } from 'react';
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
import { AlertCircle, Save, Loader2 } from 'lucide-react';

interface Panel {
  id: string;
  name: string;
  description: string | null;
  _count: {
    memberships: number;
  };
}

interface QuestionnaireData {
  id: string;
  title: string;
  version: number;
  status: string;
  questions: Question[];
  targeting: {
    type: string;
    panelIds: string[];
    villageIds: string[];
    roles: string[];
  };
  anonymous: boolean;
  responseLimit: string | null;
  startAt: string | null;
  endAt: string | null;
  maxResponses: number | null;
}

interface QuestionnaireEditFormProps {
  questionnaire: QuestionnaireData;
  availablePanels: Panel[];
  canEdit: boolean;
}

export function QuestionnaireEditForm({
  questionnaire,
  availablePanels,
  canEdit,
}: QuestionnaireEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState(questionnaire.title);
  const [questions, setQuestions] = useState<Question[]>(questionnaire.questions);
  const [targetingType, setTargetingType] = useState(questionnaire.targeting.type);
  const [selectedPanels, setSelectedPanels] = useState<string[]>(questionnaire.targeting.panelIds);
  const [anonymous, setAnonymous] = useState(questionnaire.anonymous);
  const [responseLimit, setResponseLimit] = useState(questionnaire.responseLimit || 'unlimited');
  const [endAt, setEndAt] = useState(
    questionnaire.endAt ? new Date(questionnaire.endAt).toISOString().slice(0, 16) : ''
  );
  const [maxResponses, setMaxResponses] = useState(questionnaire.maxResponses || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (questions.length === 0) {
      setError('At least one question is required');
      return;
    }

    // Check all questions have text
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q) continue;
      if (!q.text.en.trim() && !q.text.fr.trim()) {
        setError(`Question ${i + 1} must have text in at least one language`);
        return;
      }
      if ((q.type === 'mcq_single' || q.type === 'mcq_multiple') && (!q.config?.options || q.config.options.length < 2)) {
        setError(`Question ${i + 1} must have at least 2 options`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const updateData: any = {
        title,
        questions,
        targeting: {
          type: targetingType,
          panelIds: targetingType === 'specific_panels' ? selectedPanels : [],
          villageIds: [], // Can be extended later
          roles: [], // Can be extended later
        },
        anonymous,
        responseLimit: responseLimit === 'unlimited' ? null : responseLimit,
        endAt: endAt ? new Date(endAt).toISOString() : null,
        maxResponses: maxResponses ? Number(maxResponses) : null,
      };

      const response = await fetch(`/api/questionnaires/${questionnaire.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update questionnaire');
      }

      // Redirect to questionnaire detail page
      router.push(`/research/questionnaires/${questionnaire.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  const handlePanelToggle = (panelId: string, checked: boolean) => {
    if (checked) {
      setSelectedPanels([...selectedPanels, panelId]);
    } else {
      setSelectedPanels(selectedPanels.filter(id => id !== panelId));
    }
  };

  if (!canEdit) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This questionnaire cannot be edited because it is {questionnaire.status}.
          Only draft questionnaires can be modified.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General Info</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="targeting">Targeting & Settings</TabsTrigger>
        </TabsList>

        {/* General Info Tab */}
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
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Q4 2024 Guest Experience Survey"
                  required
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {title.length}/200 characters
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Version</Label>
                  <p className="text-lg font-medium">v{questionnaire.version}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <p className="text-lg font-medium capitalize">{questionnaire.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Build Your Questions</CardTitle>
              <CardDescription>
                Add and configure questions for your questionnaire. Questions support both English and French.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuestionBuilder questions={questions} onChange={setQuestions} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Targeting & Settings Tab */}
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
                <Label htmlFor="targetingType">Target Audience</Label>
                <Select value={targetingType} onValueChange={setTargetingType}>
                  <SelectTrigger id="targetingType">
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
                  <Label>Select Panels</Label>
                  {availablePanels.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No panels available. Create a panel first.
                    </p>
                  ) : (
                    <div className="space-y-2 border rounded-lg p-4">
                      {availablePanels.map((panel) => (
                        <div key={panel.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={`panel-${panel.id}`}
                            checked={selectedPanels.includes(panel.id)}
                            onCheckedChange={(checked) => handlePanelToggle(panel.id, !!checked)}
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={`panel-${panel.id}`}
                              className="font-medium cursor-pointer"
                            >
                              {panel.name}
                            </Label>
                            {panel.description && (
                              <p className="text-xs text-muted-foreground">
                                {panel.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {panel._count.memberships} members
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                    <SelectItem value="once">Once only</SelectItem>
                    <SelectItem value="daily">Once per day</SelectItem>
                    <SelectItem value="weekly">Once per week</SelectItem>
                  </SelectContent>
                </Select>
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
                  Leave empty for no end date
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

      {/* Submit Button */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
