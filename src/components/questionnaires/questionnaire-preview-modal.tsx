'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Star, Info } from 'lucide-react';
import type { Question } from './question-builder';

interface QuestionnairePreviewModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  questions: Question[];
}

type Language = 'en' | 'fr';

export function QuestionnairePreviewModal({
  open,
  onClose,
  title,
  questions,
}: QuestionnairePreviewModalProps) {
  const [language, setLanguage] = useState<Language>('en');
  const [isMobile, setIsMobile] = useState(false);

  // Preview-only form state (not submitted)
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});

  // Detect if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getQuestionText = (question: Question): string => {
    // English-only format (v0.6.0+)
    return question.text;
  };

  const renderQuestionPreview = (question: Question, index: number) => {
    const questionText = getQuestionText(question);
    const value = previewValues[question.id];

    return (
      <Card key={question.id} className="mb-3 md:mb-4">
        <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
          <div className="space-y-3 md:space-y-4">
            <div>
              <Label className="text-sm md:text-base font-medium leading-relaxed">
                {index + 1}. {questionText}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>

            {question.type === 'likert' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground mb-2">
                  <span className="text-left">{language === 'en' ? 'Strongly Disagree' : 'Totalement en désaccord'}</span>
                  <span className="text-right">{language === 'en' ? 'Strongly Agree' : 'Totalement d\'accord'}</span>
                </div>
                <RadioGroup
                  value={value?.toString()}
                  onValueChange={(v) => setPreviewValues({ ...previewValues, [question.id]: parseInt(v) })}
                >
                  <div className="flex gap-2 md:gap-3 justify-center">
                    {Array.from({ length: question.config?.scale || 5 }, (_, i) => i + 1).map((num) => (
                      <div key={num} className="flex flex-col items-center gap-1">
                        <RadioGroupItem
                          value={num.toString()}
                          id={`preview-${question.id}-${num}`}
                          className="h-5 w-5 md:h-4 md:w-4"
                        />
                        <Label htmlFor={`preview-${question.id}-${num}`} className="text-xs md:text-sm cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center">
                          {num}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}

            {question.type === 'nps' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{language === 'en' ? 'Not at all likely' : 'Pas du tout probable'}</span>
                  <span>{language === 'en' ? 'Extremely likely' : 'Extrêmement probable'}</span>
                </div>
                <RadioGroup
                  value={value?.toString()}
                  onValueChange={(v) => setPreviewValues({ ...previewValues, [question.id]: parseInt(v) })}
                >
                  <div className="flex gap-2 justify-between">
                    {Array.from({ length: 11 }, (_, i) => i).map((num) => (
                      <div key={num} className="flex flex-col items-center gap-1">
                        <RadioGroupItem value={num.toString()} id={`preview-nps-${question.id}-${num}`} />
                        <Label htmlFor={`preview-nps-${question.id}-${num}`} className="text-sm cursor-pointer">
                          {num}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}

            {question.type === 'mcq_single' && (
              <RadioGroup
                value={value}
                onValueChange={(v) => setPreviewValues({ ...previewValues, [question.id]: v })}
              >
                <div className="space-y-2">
                  {(question.config?.options || []).map((option, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`preview-${question.id}-${idx}`} />
                      <Label htmlFor={`preview-${question.id}-${idx}`} className="cursor-pointer font-normal">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {question.type === 'mcq_multiple' && (
              <div className="space-y-2">
                {(question.config?.options || []).map((option, idx) => {
                  const selectedValues = Array.isArray(value) ? value : [];
                  return (
                    <div key={idx} className="flex items-center space-x-2">
                      <Checkbox
                        id={`preview-${question.id}-${idx}`}
                        checked={selectedValues.includes(option)}
                        onCheckedChange={(checked) => {
                          const newValues = checked
                            ? [...selectedValues, option]
                            : selectedValues.filter((v) => v !== option);
                          setPreviewValues({ ...previewValues, [question.id]: newValues });
                        }}
                      />
                      <Label htmlFor={`preview-${question.id}-${idx}`} className="cursor-pointer font-normal">
                        {option}
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}

            {question.type === 'text' && (
              <Textarea
                value={value || ''}
                onChange={(e) => setPreviewValues({ ...previewValues, [question.id]: e.target.value })}
                placeholder={language === 'en' ? 'Enter your response...' : 'Entrez votre réponse...'}
                maxLength={question.config?.maxLength}
                rows={4}
                className="min-h-[100px] text-base"
              />
            )}

            {question.type === 'number' && (
              <Input
                type="number"
                value={value || ''}
                onChange={(e) => setPreviewValues({ ...previewValues, [question.id]: e.target.value })}
                placeholder={language === 'en' ? 'Enter a number...' : 'Entrez un nombre...'}
                min={question.config?.min}
                max={question.config?.max}
                className="min-h-[44px] text-base"
              />
            )}

            {question.type === 'rating' && (
              <div className="flex gap-1 flex-wrap items-center">
                {Array.from({ length: question.config?.scale || 5 }, (_, i) => i + 1).map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setPreviewValues({ ...previewValues, [question.id]: rating })}
                    className="focus:outline-none focus:ring-2 focus:ring-ring rounded-sm transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label={`Rate ${rating} out of ${question.config?.scale || 5} stars`}
                  >
                    <Star
                      className={`h-7 w-7 md:h-8 md:w-8 ${
                        value >= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-300'
                      }`}
                    />
                  </button>
                ))}
                {value > 0 && (
                  <span className="ml-2 text-xs md:text-sm text-muted-foreground self-center">
                    {value} / {question.config?.scale || 5}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Shared content for both mobile and desktop
  const renderContent = () => (
    <>
      {/* Language Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-3 md:pb-4 gap-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-xs md:text-sm text-muted-foreground">
            {language === 'en'
              ? 'Preview how respondents will see this questionnaire'
              : 'Prévisualisez comment les répondants verront ce questionnaire'}
          </span>
        </div>
        <Tabs value={language} onValueChange={(v) => setLanguage(v as Language)}>
          <TabsList className="h-auto">
            <TabsTrigger value="en" className="min-h-[44px] text-sm md:text-base">English</TabsTrigger>
            <TabsTrigger value="fr" className="min-h-[44px] text-sm md:text-base">Français</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Preview Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs md:text-sm">
          {language === 'en'
            ? 'This is preview mode. You can interact with the questions, but responses will not be submitted.'
            : 'Ceci est le mode aperçu. Vous pouvez interagir avec les questions, mais les réponses ne seront pas soumises.'}
        </AlertDescription>
      </Alert>

      {/* Questions Preview */}
      <div className="space-y-3 md:space-y-4">
        {questions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm md:text-base text-muted-foreground">
              {language === 'en'
                ? 'No questions added yet. Add questions to see them here.'
                : 'Aucune question ajoutée. Ajoutez des questions pour les voir ici.'}
            </CardContent>
          </Card>
        ) : (
          questions.map((question, index) => renderQuestionPreview(question, index))
        )}
      </div>
    </>
  );

  const renderFooter = () => (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full border-t pt-3 md:pt-4">
      <span className="text-xs md:text-sm text-muted-foreground">
        {language === 'en'
          ? `${questions.length} question${questions.length !== 1 ? 's' : ''} in this questionnaire`
          : `${questions.length} question${questions.length !== 1 ? 's' : ''} dans ce questionnaire`}
      </span>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button onClick={onClose} variant="outline" className="w-full sm:w-auto min-h-[44px] text-base">
          {language === 'en' ? 'Close Preview' : 'Fermer l\'aperçu'}
        </Button>
        <Button disabled className="w-full sm:w-auto cursor-not-allowed opacity-50 min-h-[44px] text-base">
          {language === 'en' ? 'Submit (Preview Mode)' : 'Soumettre (Mode Aperçu)'}
        </Button>
      </div>
    </div>
  );

  // Mobile: Full-screen Sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[95vh] flex flex-col p-0">
          <SheetHeader className="px-4 pt-4 pb-3 border-b">
            <SheetTitle className="text-lg">{title || 'Untitled Questionnaire'}</SheetTitle>
            <SheetDescription className="text-xs">
              {language === 'en'
                ? 'This is a preview - responses will not be saved'
                : 'Ceci est un aperçu - les réponses ne seront pas enregistrées'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {renderContent()}
          </div>

          <SheetFooter className="px-4 pb-4">
            {renderFooter()}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl">{title || 'Untitled Questionnaire'}</DialogTitle>
          <DialogDescription className="text-sm">
            {language === 'en'
              ? 'This is a preview - responses will not be saved'
              : 'Ceci est un aperçu - les réponses ne seront pas enregistrées'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {renderContent()}
        </div>

        <DialogFooter>
          {renderFooter()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
