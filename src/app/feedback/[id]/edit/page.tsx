'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Feedback } from '@/types/feedback';
import { isWithinEditWindow } from '@/lib/utils';

const formSchema = z.object({
  title: z
    .string()
    .min(8, 'Title must be at least 8 characters')
    .max(120, 'Title must not exceed 120 characters'),
  body: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(5000, 'Description must not exceed 5000 characters'),
});

type FormValues = z.infer<typeof formSchema>;

// Mock feedback data
const mockFeedback: Feedback = {
  id: 'fb_01HXQJ9K2M3N4P5Q6R7S8T9V0W',
  title: 'Add passport scanning to speed up check-in process',
  body: 'Currently, the check-in process requires manual entry of passport information which can take 3-5 minutes per guest.',
  author: {
    id: 'usr_001',
    displayName: 'Marie Dubois',
    email: 'marie.dubois@clubmed.com',
  },
  state: 'new',
  visibility: 'public',
  source: 'web',
  productArea: 'Check-in',
  moderationStatus: 'approved',
  voteCount: 5,
  voteWeight: 5,
  createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
  updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  editableUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes left
};

export default function EditFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const feedbackId = params.id as string;

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(true);

  // Mock current user
  const currentUserId = 'usr_001';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      body: '',
    },
  });

  const titleValue = form.watch('title');
  const bodyValue = form.watch('body');

  useEffect(() => {
    const fetchFeedback = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // TODO: Replace with real API call
        // const response = await fetch(`/api/feedback/${feedbackId}`);
        // if (!response.ok) throw new Error('Failed to fetch feedback');
        // const data = await response.json();

        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 500));
        const data = mockFeedback;

        // Check authorization
        if (data.author.id !== currentUserId) {
          setIsAuthorized(false);
          setError('You are not authorized to edit this feedback');
          return;
        }

        // Check if within edit window
        if (!isWithinEditWindow(data.createdAt)) {
          setIsAuthorized(false);
          setError('The edit window (15 minutes) has expired');
          return;
        }

        setFeedback(data);
        form.reset({
          title: data.title,
          body: data.body,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, [feedbackId, form, currentUserId]);

  const onSubmit = async (values: FormValues) => {
    if (!feedback) return;

    setIsSubmitting(true);

    try {
      // TODO: Replace with real API call
      // const response = await fetch(`/api/feedback/${feedbackId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(values),
      // });
      //
      // if (!response.ok) throw new Error('Failed to update feedback');

      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Feedback updated',
        description: 'Your changes have been saved successfully.',
      });

      router.push(`/feedback/${feedbackId}`);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update feedback',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-8 w-24 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthorized || error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-6 flex gap-4">
          <Button asChild variant="outline">
            <Link href={`/feedback/${feedbackId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              View Feedback
            </Link>
          </Button>
          <Button asChild>
            <Link href="/feedback">Go to Feedback List</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>Feedback not found</AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/feedback">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Feedback
          </Link>
        </Button>
      </div>
    );
  }

  // Calculate remaining time
  const remainingMinutes = Math.max(
    0,
    Math.floor((new Date(feedback.editableUntil).getTime() - Date.now()) / 1000 / 60)
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/feedback/${feedbackId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Feedback
        </Link>
      </Button>

      {/* Edit window warning */}
      {remainingMinutes <= 5 && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Edit window closing soon</AlertTitle>
          <AlertDescription>
            You have {remainingMinutes} {remainingMinutes === 1 ? 'minute' : 'minutes'} left to
            edit this feedback.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Edit Feedback</CardTitle>
          <CardDescription>
            Make changes to your feedback. Only the title and description can be edited.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Title <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief summary of your feedback"
                        {...field}
                        aria-describedby="title-count"
                      />
                    </FormControl>
                    <div className="flex items-center justify-end">
                      <span
                        id="title-count"
                        className="text-xs text-muted-foreground"
                        aria-live="polite"
                      >
                        {field.value.length}/120
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Body */}
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Description <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your feedback in detail"
                        className="min-h-[150px] resize-y"
                        {...field}
                        aria-describedby="body-count"
                      />
                    </FormControl>
                    <div className="flex items-center justify-end">
                      <span
                        id="body-count"
                        className="text-xs text-muted-foreground"
                        aria-live="polite"
                      >
                        {field.value.length}/5000
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Info */}
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Note:</strong> Product area, village context, and other metadata cannot
                  be changed after submission. If you need to modify these, please contact a
                  moderator.
                </AlertDescription>
              </Alert>

              {/* Submit buttons */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
