'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface Question {
  id: string;
  type: 'likert' | 'nps' | 'mcq_single' | 'mcq_multiple' | 'text' | 'number';
  text: {
    en: string;
    fr: string;
  };
  required: boolean;
  config?: {
    scale?: number;
    options?: string[];
    min?: number;
    max?: number;
    maxLength?: number;
  };
}

interface QuestionRendererProps {
  question: Question;
  language: 'en' | 'fr';
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export function QuestionRendererI18n({
  question,
  language,
  value,
  onChange,
  error,
}: QuestionRendererProps) {
  const questionText = question.text[language];
  const placeholders = {
    en: {
      textResponse: 'Type your answer...',
      number: 'Enter a number',
      notLikely: 'Not likely',
      veryLikely: 'Very likely',
    },
    fr: {
      textResponse: 'Tapez votre réponse...',
      number: 'Entrez un nombre',
      notLikely: 'Pas probable',
      veryLikely: 'Très probable',
    },
  };

  const t = placeholders[language];

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">
        {questionText}
        {question.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {/* Likert Scale */}
      {question.type === 'likert' && (
        <RadioGroup value={String(value || '')} onValueChange={(v) => onChange(Number(v))}>
          <div className="flex gap-4">
            {Array.from({ length: question.config?.scale || 5 }, (_, i) => i + 1).map(
              (num) => (
                <div key={num} className="flex flex-col items-center space-y-2">
                  <RadioGroupItem value={String(num)} id={`${question.id}-${num}`} />
                  <Label htmlFor={`${question.id}-${num}`} className="text-sm cursor-pointer">
                    {num}
                  </Label>
                </div>
              )
            )}
          </div>
        </RadioGroup>
      )}

      {/* NPS */}
      {question.type === 'nps' && (
        <div className="space-y-2">
          <RadioGroup value={String(value || '')} onValueChange={(v) => onChange(Number(v))}>
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 11 }, (_, i) => i).map((num) => (
                <div key={num} className="flex flex-col items-center">
                  <RadioGroupItem value={String(num)} id={`${question.id}-${num}`} />
                  <Label htmlFor={`${question.id}-${num}`} className="text-xs cursor-pointer">
                    {num}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t.notLikely}</span>
            <span>{t.veryLikely}</span>
          </div>
        </div>
      )}

      {/* MCQ Single */}
      {question.type === 'mcq_single' && (
        <RadioGroup value={value || ''} onValueChange={onChange}>
          <div className="space-y-2">
            {(question.config?.options || []).map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer font-normal">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      )}

      {/* MCQ Multiple */}
      {question.type === 'mcq_multiple' && (
        <div className="space-y-2">
          {(question.config?.options || []).map((option, index) => {
            const selected = Array.isArray(value) ? value : [];
            return (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={selected.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selected, option]);
                    } else {
                      onChange(selected.filter((v: string) => v !== option));
                    }
                  }}
                />
                <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer font-normal">
                  {option}
                </Label>
              </div>
            );
          })}
        </div>
      )}

      {/* Text */}
      {question.type === 'text' && (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t.textResponse}
          maxLength={question.config?.maxLength}
          rows={4}
        />
      )}

      {/* Number */}
      {question.type === 'number' && (
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          min={question.config?.min}
          max={question.config?.max}
          placeholder={t.number}
        />
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
