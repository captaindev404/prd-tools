'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Copy, ChevronUp, ChevronDown } from 'lucide-react';
import { ulid } from 'ulid';

export interface Question {
  id: string;
  type: 'likert' | 'nps' | 'mcq_single' | 'mcq_multiple' | 'text' | 'number';
  text: {
    en: string;
    fr: string;
  };
  required: boolean;
  config?: {
    scale?: number; // For Likert (e.g., 5 or 7)
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

  const addQuestion = () => {
    const newQuestion: Question = {
      id: ulid(),
      type: selectedType,
      text: { en: '', fr: '' },
      required: false,
      config: selectedType === 'likert' ? { scale: 5 } : {},
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
    [newQuestions[index], newQuestions[newIndex]] = [
      newQuestions[newIndex],
      newQuestions[index],
    ];
    onChange(newQuestions);
  };

  return (
    <div className="space-y-6">
      {/* Add Question Section */}
      <Card>
        <CardHeader>
          <CardTitle>Add Question</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Select value={selectedType} onValueChange={(value) => setSelectedType(value as Question['type'])}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="likert">Likert Scale</SelectItem>
              <SelectItem value="nps">NPS (0-10)</SelectItem>
              <SelectItem value="mcq_single">Multiple Choice (Single)</SelectItem>
              <SelectItem value="mcq_multiple">Multiple Choice (Multiple)</SelectItem>
              <SelectItem value="text">Text Response</SelectItem>
              <SelectItem value="number">Number Input</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={addQuestion}>
            <Plus className="mr-2 h-4 w-4" /> Add Question
          </Button>
        </CardContent>
      </Card>

      {/* Questions List */}
      {questions.length === 0 ? (
        <p className="text-center text-muted-foreground">No questions yet. Add your first question above.</p>
      ) : (
        questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Question {index + 1} - {question.type.replace('_', ' ').toUpperCase()}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveQuestion(question.id, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveQuestion(question.id, 'down')}
                    disabled={index === questions.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => duplicateQuestion(question)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(question.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* English Text */}
              <div>
                <Label>Question Text (English)</Label>
                <Textarea
                  placeholder="Enter question in English..."
                  value={question.text.en}
                  onChange={(e) =>
                    updateQuestion(question.id, {
                      text: { ...question.text, en: e.target.value },
                    })
                  }
                />
              </div>

              {/* French Text */}
              <div>
                <Label>Question Text (French)</Label>
                <Textarea
                  placeholder="Entrez la question en français..."
                  value={question.text.fr}
                  onChange={(e) =>
                    updateQuestion(question.id, {
                      text: { ...question.text, fr: e.target.value },
                    })
                  }
                />
              </div>

              {/* Type-specific config */}
              {question.type === 'likert' && (
                <div>
                  <Label>Scale</Label>
                  <Select
                    value={String(question.config?.scale || 5)}
                    onValueChange={(value) =>
                      updateQuestion(question.id, {
                        config: { ...question.config, scale: Number(value) },
                      })
                    }
                  >
                    <SelectTrigger>
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
                  <Label>Options (one per line)</Label>
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
                  />
                </div>
              )}

              {question.type === 'number' && (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>Min Value</Label>
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
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Max Value</Label>
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
                    />
                  </div>
                </div>
              )}

              {question.type === 'text' && (
                <div>
                  <Label>Max Length (optional)</Label>
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
                  />
                </div>
              )}

              {/* Required checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`required-${question.id}`}
                  checked={question.required}
                  onCheckedChange={(checked) =>
                    updateQuestion(question.id, { required: !!checked })
                  }
                />
                <Label htmlFor={`required-${question.id}`}>Required question</Label>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
