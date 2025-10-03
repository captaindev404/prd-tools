'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import type { Question, LikertQuestion, MCQQuestion, TextQuestion, RatingQuestion } from '@/types/questionnaire';
import { QuestionType } from '@/types/questionnaire';

interface QuestionRendererProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export function QuestionRenderer({ question, value, onChange, error }: QuestionRendererProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor={question.id} className="text-base">
          {question.text}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      </div>

      {renderQuestionInput(question, value, onChange)}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

function renderQuestionInput(question: Question, value: any, onChange: (value: any) => void) {
  switch (question.type) {
    case QuestionType.LIKERT_5:
    case QuestionType.LIKERT_7:
      return <LikertInput question={question as LikertQuestion} value={value} onChange={onChange} />;

    case QuestionType.NPS:
      return <NPSInput value={value} onChange={onChange} />;

    case QuestionType.MCQ_SINGLE:
      return <MCQSingleInput question={question as MCQQuestion} value={value} onChange={onChange} />;

    case QuestionType.MCQ_MULTIPLE:
      return <MCQMultipleInput question={question as MCQQuestion} value={value} onChange={onChange} />;

    case QuestionType.TEXT:
      return <TextInput question={question as TextQuestion} value={value} onChange={onChange} />;

    case QuestionType.RATING:
      return <RatingInput question={question as RatingQuestion} value={value} onChange={onChange} />;

    default:
      return <div>Unknown question type</div>;
  }
}

function LikertInput({
  question,
  value,
  onChange,
}: {
  question: LikertQuestion;
  value: any;
  onChange: (value: any) => void;
}) {
  const scale = question.type === QuestionType.LIKERT_7 ? 7 : 5;
  const options = Array.from({ length: scale }, (_, i) => i + 1);

  return (
    <RadioGroup value={value?.toString()} onValueChange={(v) => onChange(parseInt(v))}>
      <div className="flex items-center justify-between gap-2">
        {question.labels?.lowest && (
          <span className="text-xs text-muted-foreground">{question.labels.lowest}</span>
        )}
        <div className="flex gap-3">
          {options.map((num) => (
            <div key={num} className="flex flex-col items-center gap-1">
              <RadioGroupItem value={num.toString()} id={`${question.id}-${num}`} />
              <Label htmlFor={`${question.id}-${num}`} className="text-sm cursor-pointer">
                {num}
              </Label>
            </div>
          ))}
        </div>
        {question.labels?.highest && (
          <span className="text-xs text-muted-foreground">{question.labels.highest}</span>
        )}
      </div>
    </RadioGroup>
  );
}

function NPSInput({ value, onChange }: { value: any; onChange: (value: any) => void }) {
  const options = Array.from({ length: 11 }, (_, i) => i);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Not at all likely</span>
        <span>Extremely likely</span>
      </div>
      <RadioGroup value={value?.toString()} onValueChange={(v) => onChange(parseInt(v))}>
        <div className="flex gap-2 justify-between">
          {options.map((num) => (
            <div key={num} className="flex flex-col items-center gap-1">
              <RadioGroupItem value={num.toString()} id={`nps-${num}`} />
              <Label htmlFor={`nps-${num}`} className="text-sm cursor-pointer">
                {num}
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}

function MCQSingleInput({
  question,
  value,
  onChange,
}: {
  question: MCQQuestion;
  value: any;
  onChange: (value: any) => void;
}) {
  return (
    <RadioGroup value={value} onValueChange={onChange}>
      <div className="space-y-2">
        {question.options.map((option) => (
          <div key={option.id} className="flex items-center space-x-2">
            <RadioGroupItem value={option.id} id={option.id} />
            <Label htmlFor={option.id} className="cursor-pointer font-normal">
              {option.text}
            </Label>
          </div>
        ))}
      </div>
    </RadioGroup>
  );
}

function MCQMultipleInput({
  question,
  value,
  onChange,
}: {
  question: MCQQuestion;
  value: any;
  onChange: (value: any) => void;
}) {
  const selectedValues = Array.isArray(value) ? value : [];

  const handleToggle = (optionId: string) => {
    const newValues = selectedValues.includes(optionId)
      ? selectedValues.filter((v) => v !== optionId)
      : [...selectedValues, optionId];
    onChange(newValues);
  };

  return (
    <div className="space-y-2">
      {question.options.map((option) => (
        <div key={option.id} className="flex items-center space-x-2">
          <Checkbox
            id={option.id}
            checked={selectedValues.includes(option.id)}
            onCheckedChange={() => handleToggle(option.id)}
          />
          <Label htmlFor={option.id} className="cursor-pointer font-normal">
            {option.text}
          </Label>
        </div>
      ))}
    </div>
  );
}

function TextInput({
  question,
  value,
  onChange,
}: {
  question: TextQuestion;
  value: any;
  onChange: (value: any) => void;
}) {
  if (question.multiline) {
    return (
      <Textarea
        id={question.id}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        maxLength={question.maxLength}
        placeholder="Enter your response..."
        rows={4}
      />
    );
  }

  return (
    <Input
      id={question.id}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      maxLength={question.maxLength}
      placeholder="Enter your response..."
    />
  );
}

function RatingInput({
  question,
  value,
  onChange,
}: {
  question: RatingQuestion;
  value: any;
  onChange: (value: any) => void;
}) {
  const maxRating = question.maxRating || 5;
  const stars = Array.from({ length: maxRating }, (_, i) => i + 1);

  return (
    <div className="flex gap-1">
      {stars.map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange(rating)}
          className="focus:outline-none transition-colors"
        >
          <Star
            className={`h-8 w-8 ${
              value >= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 hover:text-yellow-300'
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm text-muted-foreground self-center">
          {value} / {maxRating}
        </span>
      )}
    </div>
  );
}
