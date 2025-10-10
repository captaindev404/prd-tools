'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useSession } from 'next-auth/react';
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
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DuplicateSuggestions } from '@/components/feedback/DuplicateSuggestions';
import { FileUpload, type UploadedFile } from '@/components/feedback/FileUpload';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { DuplicateSuggestion, Attachment } from '@/types/feedback';
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
  productArea: z.enum(['Reservations', 'CheckIn', 'Payments', 'Housekeeping', 'Backoffice']).optional(),
  villageId: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

// Hardcoded villages list - TODO: Replace with API call when more villages are added
const VILLAGES = [
  { id: 'vlg-001', name: 'La Rosière' },
  { id: 'vlg-002', name: 'Punta Cana' },
  { id: 'vlg-003', name: 'Cancún' },
  { id: 'vlg-004', name: 'Val Thorens' },
];

export default function NewFeedbackPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateSuggestion[]>([]);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      body: '',
      productArea: undefined,
      villageId: (session?.user as any)?.currentVillageId || undefined,
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
      const response = await fetch(
        `/api/feedback/check-duplicates?title=${encodeURIComponent(title)}`
      );

      if (!response.ok) {
        throw new Error('Failed to check duplicates');
      }

      const data = await response.json();

      // Map the API response to DuplicateSuggestion format
      const duplicateSuggestions: DuplicateSuggestion[] = data.duplicates.map((dup: any) => ({
        id: dup.id,
        title: dup.title,
        similarity: dup.similarity,
        voteCount: dup.voteCount,
        state: dup.state,
      }));

      // Only show if similarity is high enough (API already filters at 0.86)
      setDuplicates(duplicateSuggestions);
      setShowDuplicates(duplicateSuggestions.length > 0);
    } catch (err) {
      console.error('Failed to check duplicates:', err);
      // Silently fail - duplicate checking is not critical
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
      // Map UploadedFile to Attachment format expected by API
      // Note: FileUpload component returns files with fields: id, name, size, type, url
      // We need to adapt these to match Attachment interface
      const attachmentData: Attachment[] = attachments.map((file) => ({
        id: file.id,
        originalName: file.name,
        storedName: file.name, // Extract from URL or use name as fallback
        url: file.url,
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
      }));

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title,
          body: values.body,
          productArea: values.productArea,
          villageId: values.villageId === 'none' ? null : values.villageId,
          source: 'web' as const,
          visibility: 'public' as const,
          attachments: attachmentData.length > 0 ? attachmentData : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (response.status === 400 && data.details) {
          const errorMessages = data.details
            .map((err: { field: string; message: string }) => err.message)
            .join(', ');
          throw new Error(errorMessages);
        }

        // Handle rate limiting
        if (response.status === 429) {
          throw new Error(data.message || 'Rate limit exceeded. Please try again later.');
        }

        throw new Error(data.message || 'Failed to create feedback');
      }

      toast({
        title: 'Feedback submitted',
        description: 'Thank you for sharing your feedback!',
      });

      // Redirect to the newly created feedback
      router.push(`/feedback/${data.data.id}`);
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
                    <FormLabel>Product Area (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        // Handle "none" selection by setting undefined
                        field.onChange(value === 'none' ? undefined : value);
                      }}
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product area (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No specific area</SelectItem>
                        <SelectItem value="Reservations">Reservations</SelectItem>
                        <SelectItem value="CheckIn">Check-in</SelectItem>
                        <SelectItem value="Payments">Payments</SelectItem>
                        <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                        <SelectItem value="Backoffice">Backoffice</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the product area this feedback relates to (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Village Context */}
              <FormField
                control={form.control}
                name="villageId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Village Context (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        // Handle "none" selection by setting null
                        field.onChange(value === 'none' ? null : value);
                      }}
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger aria-describedby="village-description">
                          <SelectValue placeholder="Select a village (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No specific village</SelectItem>
                        {VILLAGES.map((village) => (
                          <SelectItem key={village.id} value={village.id}>
                            {village.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription id="village-description">
                      If this feedback is specific to a particular village, select it here. Leave as &quot;No specific village&quot; for platform-wide feedback.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Attachments */}
              <div className="space-y-2">
                <FormLabel>Attachments (Optional)</FormLabel>
                <FileUpload
                  onChange={setAttachments}
                  disabled={isSubmitting}
                  maxFiles={5}
                  maxSize={10 * 1024 * 1024}
                />
                <FormDescription>
                  Add screenshots, documents, or other files to support your feedback (max 5 files, 10MB each)
                </FormDescription>
              </div>

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
