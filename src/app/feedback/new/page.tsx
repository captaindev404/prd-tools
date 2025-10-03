'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { DuplicateSuggestions } from '@/components/feedback/DuplicateSuggestions';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ProductArea, DuplicateSuggestion } from '@/types/feedback';
import { debounce } from '@/lib/utils';

const formSchema = z.object({
  title: z
    .string()
    .min(8, 'Title must be at least 8 characters')
    .max(120, 'Title must not exceed 120 characters'),
  body: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(5000, 'Description must not exceed 5000 characters'),
  productArea: z.string().optional(),
  villageContext: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const productAreas: ProductArea[] = [
  'Reservations',
  'Check-in',
  'Payments',
  'Housekeeping',
  'Backoffice',
];

export default function NewFeedbackPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateSuggestion[]>([]);
  const [showDuplicates, setShowDuplicates] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      body: '',
      productArea: '',
      villageContext: '',
    },
  });

  const titleValue = form.watch('title');
  const bodyValue = form.watch('body');

  // Check for duplicates when title changes
  const checkDuplicates = debounce(async (title: string) => {
    if (title.length < 8) {
      setDuplicates([]);
      setShowDuplicates(false);
      return;
    }

    setIsCheckingDuplicates(true);
    try {
      // TODO: Replace with real API call
      // const response = await fetch(`/api/feedback/duplicates?title=${encodeURIComponent(title)}`);
      // const data = await response.json();

      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockDuplicates: DuplicateSuggestion[] = [
        {
          id: 'fb_duplicate1',
          title: 'Similar feedback about check-in improvements',
          similarity: 0.88,
          voteCount: 15,
          state: 'triaged',
        },
      ];

      // Only show if similarity is high enough
      const relevantDuplicates = mockDuplicates.filter(d => d.similarity >= 0.86);
      setDuplicates(relevantDuplicates);
      setShowDuplicates(relevantDuplicates.length > 0);
    } catch (err) {
      console.error('Failed to check duplicates:', err);
    } finally {
      setIsCheckingDuplicates(false);
    }
  }, 500);

  const handleTitleBlur = () => {
    checkDuplicates(titleValue);
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      // TODO: Replace with real API call
      // const response = await fetch('/api/feedback', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(values),
      // });
      //
      // if (!response.ok) throw new Error('Failed to create feedback');
      // const data = await response.json();

      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockId = 'fb_new_' + Date.now();

      toast({
        title: 'Feedback submitted',
        description: 'Thank you for sharing your feedback!',
      });

      router.push(`/feedback/${mockId}`);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to submit feedback',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/feedback">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Feedback
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Submit Feedback</CardTitle>
          <CardDescription>
            Share your ideas to help improve our products and services
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
                        onBlur={handleTitleBlur}
                        aria-describedby="title-description title-count"
                      />
                    </FormControl>
                    <div className="flex items-center justify-between">
                      <FormDescription id="title-description">
                        A clear, concise title helps others find similar feedback
                      </FormDescription>
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

              {/* Duplicate suggestions */}
              {showDuplicates && (
                <DuplicateSuggestions
                  suggestions={duplicates}
                  onDismiss={() => setShowDuplicates(false)}
                />
              )}

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
                        placeholder="Describe your feedback in detail. What problem does it solve? How would it help?"
                        className="min-h-[150px] resize-y"
                        {...field}
                        aria-describedby="body-description body-count"
                      />
                    </FormControl>
                    <div className="flex items-center justify-between">
                      <FormDescription id="body-description">
                        Provide context and explain the impact
                      </FormDescription>
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

              {/* Product Area */}
              <FormField
                control={form.control}
                name="productArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Area</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger aria-label="Select product area">
                          <SelectValue placeholder="Select a product area (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productAreas.map((area) => (
                          <SelectItem key={area} value={area}>
                            {area}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Help us route your feedback to the right team
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Village Context */}
              <FormField
                control={form.control}
                name="villageContext"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Village Context</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., La Rosière, Punta Cana"
                        {...field}
                        aria-describedby="village-description"
                      />
                    </FormControl>
                    <FormDescription id="village-description">
                      If your feedback is specific to a village
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Feedback'
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

      {/* Guidelines */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <ul className="list-disc pl-5 space-y-1">
            <li>Be specific and provide context about the problem or idea</li>
            <li>Check for similar feedback before submitting to avoid duplicates</li>
            <li>Focus on one topic per feedback item</li>
            <li>Be respectful and constructive in your feedback</li>
            <li>You can edit your feedback for 15 minutes after submission</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
