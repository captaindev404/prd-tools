'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Trash2, Copy, ChevronUp, ChevronDown, HelpCircle, Library } from 'lucide-react';
import { ulid } from 'ulid';
import { QuestionTemplateLibrary } from './QuestionTemplateLibrary';

/**
 * Question interface for questionnaire builder
 * @version 0.6.0 - Simplified to English-only
 */
export interface Question {
  id: string;
  type: 'likert' | 'nps' | 'mcq_single' | 'mcq_multiple' | 'text' | 'number' | 'rating';
  text: string; // English only (v0.6.0+)
  required: boolean;
  config?: {
    scale?: number; // For Likert (e.g., 5 or 7) and Rating (e.g., 5 stars)
    options?: string[]; // For MCQ
    min?: number; // For Number
    max?: number; // For Number
    maxLength?: number; // For Text
  };
}

interface QuestionBuilderProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
}

export function QuestionBuilder({ questions, onChange }: QuestionBuilderProps) {
  const [selectedType, setSelectedType] = useState<Question['type']>('likert');
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: ulid(),
      type: selectedType,
      text: '', // English only (v0.6.0+)
      required: false,
      config: selectedType === 'likert'
        ? { scale: 5 }
        : selectedType === 'rating'
        ? { scale: 5 }
        : {},
    };
    onChange([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    onChange(
      questions.map(q => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const removeQuestion = (id: string) => {
    onChange(questions.filter(q => q.id !== id));
  };

  const duplicateQuestion = (question: Question) => {
    const duplicate = { ...question, id: ulid() };
    const index = questions.findIndex(q => q.id === question.id);
    onChange([
      ...questions.slice(0, index + 1),
      duplicate,
      ...questions.slice(index + 1),
    ]);
  };

  const moveQuestion = (id: string, direction: 'up' | 'down') => {
    const index = questions.findIndex(q => q.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) {
      return;
    }

    const newQuestions = [...questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const currentQuestion = newQuestions[index];
    const targetQuestion = newQuestions[newIndex];
    if (currentQuestion && targetQuestion) {
      [newQuestions[index], newQuestions[newIndex]] = [
        targetQuestion,
        currentQuestion,
      ];
      onChange(newQuestions);
    }
  };

  const handleInsertTemplate = (question: Question) => {
    onChange([...questions, question]);
  };

  return (
    <div className="space-y-4 md:space-y-6" role="region" aria-label="Question builder">
      {/* Screen reader announcements for question changes */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {questions.length > 0 && `${questions.length} ${questions.length === 1 ? 'question' : 'questions'} in questionnaire`}
      </div>

      {/* Add Question Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg md:text-xl">Add Question</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTemplateLibraryOpen(true)}
              className="gap-2"
              aria-label="Open question template library"
            >
              <Library className="h-4 w-4" />
              <span className="hidden sm:inline">Insert Template</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="question-type-select" className="text-sm md:text-base">Question Type</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Select the type of question. Each type has different configuration options for how users respond.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={selectedType} onValueChange={(value) => setSelectedType(value as Question['type'])}>
              <SelectTrigger
                id="question-type-select"
                className="w-full min-h-[44px] text-base"
                aria-label="Select question type"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="likert">Likert Scale</SelectItem>
                <SelectItem value="nps">NPS (0-10)</SelectItem>
                <SelectItem value="mcq_single">Multiple Choice (Single)</SelectItem>
                <SelectItem value="mcq_multiple">Multiple Choice (Multiple)</SelectItem>
                <SelectItem value="text">Text Response</SelectItem>
                <SelectItem value="number">Number Input</SelectItem>
                <SelectItem value="rating">Rating (Stars)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={addQuestion}
            className="w-full sm:w-auto min-h-[44px] text-base sm:mt-8"
            aria-label={`Add ${selectedType.replace('_', ' ')} question`}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Add Question
          </Button>
        </CardContent>
      </Card>

      {/* Questions List */}
      {questions.length === 0 ? (
        <p className="text-center text-sm md:text-base text-muted-foreground py-8">No questions yet. Add your first question above.</p>
      ) : (
        questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-sm md:text-base">
                  Question {index + 1} - {question.type.replace('_', ' ').toUpperCase()}
                </CardTitle>
                <div className="flex gap-1.5 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveQuestion(question.id, 'up')}
                    disabled={index === 0}
                    className="min-h-[44px] min-w-[44px] p-2"
                    title="Move up"
                    aria-label="Move question up"
                  >
                    <ChevronUp className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveQuestion(question.id, 'down')}
                    disabled={index === questions.length - 1}
                    className="min-h-[44px] min-w-[44px] p-2"
                    title="Move down"
                    aria-label="Move question down"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => duplicateQuestion(question)}
                    className="min-h-[44px] min-w-[44px] p-2"
                    title="Duplicate"
                    aria-label="Duplicate question"
                  >
                    <Copy className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(question.id)}
                    className="min-h-[44px] min-w-[44px] p-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Delete"
                    aria-label="Delete question"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Question Text (English only) */}
              <div className="space-y-2">
                <Label htmlFor={`question-text-${question.id}`} className="text-sm md:text-base">
                  Question Text
                  <span className="text-red-500 ml-1" aria-label="required">*</span>
                </Label>
                <Textarea
                  id={`question-text-${question.id}`}
                  value={question.text}
                  onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                  placeholder="Enter your question here..."
                  className="min-h-[100px] text-base"
                  aria-required="true"
                />
              </div>

              {/* Type-specific config */}
              {question.type === 'likert' && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-sm md:text-base">Scale</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>5 or 7-point agreement scale ranging from Strongly Disagree to Strongly Agree. Commonly used for measuring attitudes and opinions.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={String(question.config?.scale || 5)}
                    onValueChange={(value) =>
                      updateQuestion(question.id, {
                        config: { ...question.config, scale: Number(value) },
                      })
                    }
                  >
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5-point scale</SelectItem>
                      <SelectItem value="7">7-point scale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(question.type === 'mcq_single' || question.type === 'mcq_multiple') && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-sm md:text-base">Options (one per line)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>
                            {question.type === 'mcq_single'
                              ? 'Multiple choice with one answer (radio buttons). Users select a single option.'
                              : 'Multiple choice with multiple answers (checkboxes). Users can select multiple options.'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                    value={(question.config?.options || []).join('\n')}
                    onChange={(e) =>
                      updateQuestion(question.id, {
                        config: {
                          ...question.config,
                          options: e.target.value.split('\n').filter(Boolean),
                        },
                      })
                    }
                    className="min-h-[100px] text-base"
                  />
                </div>
              )}

              {question.type === 'nps' && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Net Promoter Score measures likelihood to recommend on a 0-10 scale. Scores 0-6 are detractors, 7-8 are passive, and 9-10 are promoters.
                    </p>
                  </div>
                </div>
              )}

              {question.type === 'number' && (
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Label className="text-sm md:text-base">Min Value</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Numeric input with optional minimum and maximum value constraints. Useful for collecting quantitative data.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      type="number"
                      value={question.config?.min || ''}
                      onChange={(e) =>
                        updateQuestion(question.id, {
                          config: {
                            ...question.config,
                            min: e.target.value ? Number(e.target.value) : undefined,
                          },
                        })
                      }
                      placeholder="Optional"
                      className="min-h-[44px] text-base"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm md:text-base">Max Value</Label>
                    <Input
                      type="number"
                      value={question.config?.max || ''}
                      onChange={(e) =>
                        updateQuestion(question.id, {
                          config: {
                            ...question.config,
                            max: e.target.value ? Number(e.target.value) : undefined,
                          },
                        })
                      }
                      placeholder="Optional"
                      className="min-h-[44px] text-base"
                    />
                  </div>
                </div>
              )}

              {question.type === 'text' && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-sm md:text-base">Max Length (optional)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Open-ended text response. Users can write detailed answers. Set a character limit to encourage concise responses.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    type="number"
                    placeholder="e.g., 500"
                    value={question.config?.maxLength || ''}
                    onChange={(e) =>
                      updateQuestion(question.id, {
                        config: {
                          ...question.config,
                          maxLength: e.target.value ? Number(e.target.value) : undefined,
                        },
                      })
                    }
                    className="min-h-[44px] text-base"
                  />
                </div>
              )}

              {question.type === 'rating' && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-sm md:text-base">Number of Stars</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Star rating (1-5 or custom scale). Visual and intuitive way to collect satisfaction or quality ratings.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={String(question.config?.scale || 5)}
                    onValueChange={(value) =>
                      updateQuestion(question.id, {
                        config: { ...question.config, scale: Number(value) },
                      })
                    }
                  >
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 stars</SelectItem>
                      <SelectItem value="5">5 stars</SelectItem>
                      <SelectItem value="7">7 stars</SelectItem>
                      <SelectItem value="10">10 stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Required checkbox */}
              <div className="flex items-center space-x-3 min-h-[44px]">
                <Checkbox
                  id={`required-${question.id}`}
                  checked={question.required}
                  onCheckedChange={(checked) =>
                    updateQuestion(question.id, { required: !!checked })
                  }
                />
                <Label htmlFor={`required-${question.id}`} className="text-sm md:text-base cursor-pointer">
                  Required question
                </Label>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Question Template Library */}
      <QuestionTemplateLibrary
        open={isTemplateLibraryOpen}
        onOpenChange={setIsTemplateLibraryOpen}
        onInsertTemplate={handleInsertTemplate}
      />
    </div>
  );
}
