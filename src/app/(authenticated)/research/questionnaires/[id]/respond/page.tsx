'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { QuestionRendererI18n } from '@/components/questionnaires/question-renderer-i18n';

interface QuestionnaireResponsePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function QuestionnaireResponsePage({ params }: QuestionnaireResponsePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [questionnaire, setQuestionnaire] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [language, setLanguage] = useState<'en' | 'fr'>('en');
  const [eligible, setEligible] = useState(true);
  const [alreadyResponded, setAlreadyResponded] = useState(false);

  // Dynamic Zod schema based on questions
  const [formSchema, setFormSchema] = useState<z.ZodObject<any> | null>(null);

  useEffect(() => {
    fetchQuestionnaire();
  }, [id]);

  const fetchQuestionnaire = async () => {
    try {
      const response = await fetch(`/api/questionnaires/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Questionnaire not found');
        }
        throw new Error('Failed to load questionnaire');
      }

      const data = await response.json();
      setQuestionnaire(data);

      // Check if user already responded
      // This would typically be returned from the API
      if (data.hasResponded) {
        setAlreadyResponded(true);
      }

      // Check eligibility
      // This would be part of the API response
      if (data.eligible === false) {
        setEligible(false);
      }

      // Build Zod schema dynamically
      const questions = JSON.parse(data.questions || '[]');
      const schema: any = {};

      questions.forEach((q: any) => {
        if (q.required) {
          schema[q.id] = z.any().refine(val => val !== undefined && val !== '' && val !== null, {
            message: 'This question is required',
          });
        } else {
          schema[q.id] = z.any().optional();
        }
      });

      setFormSchema(z.object(schema));
    } catch (error) {
      console.error('Failed to fetch questionnaire:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load questionnaire',
        variant: 'destructive',
      });
      setEligible(false);
    } finally {
      setLoading(false);
    }
  };

  const form = useForm({
    resolver: formSchema ? zodResolver(formSchema) : undefined,
    defaultValues: {},
  });

  const onSubmit = async (data: any) => {
    setSubmitting(true);

    try {
      const response = await fetch(`/api/questionnaires/${id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit response');
      }

      toast({
        title: 'Response submitted',
        description: 'Thank you for your feedback!',
      });

      router.push(`/research/questionnaires/${id}/thank-you`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-3xl py-10 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!eligible) {
    return (
      <div className="container max-w-3xl py-10">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Not Eligible</CardTitle>
            </div>
            <CardDescription>
              You are not eligible to respond to this questionnaire.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (alreadyResponded) {
    return (
      <div className="container max-w-3xl py-10">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <CardTitle>Already Responded</CardTitle>
            </div>
            <CardDescription>
              You have already submitted a response to this questionnaire.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!questionnaire) {
    return null;
  }

  const questions = JSON.parse(questionnaire.questions || '[]');

  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{questionnaire.title}</h1>
        {questionnaire.description && (
          <p className="text-muted-foreground">{questionnaire.description}</p>
        )}
      </div>

      {/* Language Selector */}
      <div className="mb-6 flex justify-end">
        <Select value={language} onValueChange={(val) => setLanguage(val as 'en' | 'fr')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="fr">Français</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Response Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {questions.map((question: any, index: number) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-lg">Question {index + 1}</CardTitle>
              </CardHeader>
              <CardContent>
                <QuestionRendererI18n
                  question={question}
                  language={language}
                  value={form.watch(question.id)}
                  onChange={(value) => form.setValue(question.id, value)}
                  error={form.formState.errors[question.id]?.message as string}
                />
              </CardContent>
            </Card>
          ))}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Response'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
