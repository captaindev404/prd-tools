'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { QuestionRenderer } from '@/components/questionnaires/question-renderer';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2 } from 'lucide-react';
import type { Question } from '@/types/questionnaire';

export default function QuestionnaireResponsePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [questionnaire, setQuestionnaire] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchQuestionnaire();
  }, [params.id]);

  const fetchQuestionnaire = async () => {
    try {
      const response = await fetch(`/api/questionnaires/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch questionnaire');
      }
      const result = await response.json();
      setQuestionnaire(result.data);

      // Check if already responded
      if (result.data.userHasResponded) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error fetching questionnaire:', error);
      toast({
        title: 'Error',
        description: 'Failed to load questionnaire',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    // Clear error for this question
    if (errors[questionId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const validateAnswers = (): boolean => {
    const newErrors: Record<string, string> = {};
    const questions: Question[] = questionnaire.questions;

    questions.forEach((question) => {
      if (question.required && !answers[question.id]) {
        newErrors[question.id] = 'This question is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateAnswers()) {
      toast({
        title: 'Validation Error',
        description: 'Please answer all required questions',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/questionnaires/${params.id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit response');
      }

      setSubmitted(true);
      toast({
        title: 'Success',
        description: 'Your response has been submitted successfully',
      });
    } catch (error: any) {
      console.error('Error submitting response:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit response',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Questionnaire Not Found</CardTitle>
            <CardDescription>The questionnaire you are looking for does not exist.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle>Thank You!</CardTitle>
            <CardDescription>Your response has been submitted successfully.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => router.push('/research/my-questionnaires')}>
              Back to My Questionnaires
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const questions: Question[] = questionnaire.questions;
  const answeredCount = Object.keys(answers).filter((key) => answers[key] !== undefined && answers[key] !== null && answers[key] !== '').length;
  const progress = (answeredCount / questions.length) * 100;

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>{questionnaire.title}</CardTitle>
          <CardDescription>
            Please answer all questions. Fields marked with * are required.
          </CardDescription>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>
                {answeredCount} / {questions.length} answered
              </span>
            </div>
            <Progress value={progress} />
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-2">
              <div className="text-sm text-muted-foreground">Question {index + 1}</div>
              <QuestionRenderer
                question={question}
                value={answers[question.id]}
                onChange={(value) => handleAnswerChange(question.id, value)}
                error={errors[question.id]}
              />
            </div>
          ))}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit Response
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
