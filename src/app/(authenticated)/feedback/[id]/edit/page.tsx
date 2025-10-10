'use client';

import { useState, useEffect, use } from 'react';
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
import { ArrowLeft, Loader2, AlertCircle, X } from 'lucide-react';
import { Feedback, Attachment } from '@/types/feedback';
import { isWithinEditWindow } from '@/lib/utils';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { FileUpload, type UploadedFile } from '@/components/feedback/FileUpload';
import { Badge } from '@/components/ui/badge';
import { formatFileSize } from '@/components/feedback/AttachmentList';

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
  productArea: 'CheckIn',
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

  // Attachment management state
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [attachmentsToRemove, setAttachmentsToRemove] = useState<string[]>([]);
  const [newAttachments, setNewAttachments] = useState<UploadedFile[]>([]);

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
        const response = await fetch(`/api/feedback/${feedbackId}`);
        if (!response.ok) throw new Error('Failed to fetch feedback');
        const data = await response.json();

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

        // Parse and set existing attachments
        let attachments: Attachment[] = [];
        try {
          if (data.attachments && typeof data.attachments === 'string') {
            attachments = JSON.parse(data.attachments);
          } else if (Array.isArray(data.attachments)) {
            attachments = data.attachments;
          }
        } catch (err) {
          console.error('Failed to parse attachments:', err);
        }
        setExistingAttachments(attachments);

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

  // Handle removing existing attachments
  const handleRemoveExisting = (attachmentId: string) => {
    setAttachmentsToRemove(prev => [...prev, attachmentId]);
    setExistingAttachments(prev => prev.filter(a => a.id !== attachmentId));
  };

  // Handle new file uploads
  const handleNewAttachments = (files: UploadedFile[]) => {
    setNewAttachments(files);
  };

  // Calculate total attachments (respecting 5-file limit)
  const totalAttachments = existingAttachments.length + newAttachments.length;
  const maxNewFiles = Math.max(0, 5 - existingAttachments.length);

  const onSubmit = async (values: FormValues) => {
    if (!feedback) return;

    // Validate attachment count
    if (totalAttachments > 5) {
      toast({
        title: 'Too many attachments',
        description: 'Maximum 5 attachments allowed. Please remove some files.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Map UploadedFile to Attachment format
      const attachmentsToAdd: Attachment[] = newAttachments.map(file => ({
        id: file.id,
        originalName: file.name,
        storedName: file.url.split('/').pop() || file.name,
        url: file.url,
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
      }));

      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title,
          body: values.body,
          attachments: attachmentsToAdd.length > 0 ? attachmentsToAdd : undefined,
          attachmentsToRemove: attachmentsToRemove.length > 0 ? attachmentsToRemove : undefined,
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
        throw new Error(data.message || 'Failed to update feedback');
      }

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

  // Truncate title for breadcrumbs (max 50 chars)
  const truncatedTitle = feedback.title.length > 50
    ? feedback.title.substring(0, 50) + '...'
    : feedback.title;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { title: 'Feedback', href: '/feedback' },
            { title: truncatedTitle, href: `/feedback/${feedbackId}` },
            { title: 'Edit' }
          ]}
        />
      </div>

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
            Make changes to your feedback. You can edit the title, description, and manage attachments.
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

              {/* Existing Attachments */}
              {existingAttachments.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel>Current Attachments</FormLabel>
                    <Badge variant="secondary">
                      {existingAttachments.length} file{existingAttachments.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {existingAttachments.map((attachment) => (
                      <Card key={attachment.id} className="p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" title={attachment.originalName}>
                              {attachment.originalName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.size)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveExisting(attachment.id)}
                            disabled={isSubmitting}
                            aria-label={`Remove ${attachment.originalName}`}
                            className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Attachments */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel>
                    Add New Attachments {totalAttachments > 0 && `(${totalAttachments}/5)`}
                  </FormLabel>
                  {totalAttachments >= 5 && (
                    <Badge variant="destructive">Limit reached</Badge>
                  )}
                </div>
                <FormDescription>
                  {maxNewFiles === 0
                    ? 'Maximum attachments reached. Remove existing files to add new ones.'
                    : `You can add up to ${maxNewFiles} more file${maxNewFiles !== 1 ? 's' : ''}.`}
                </FormDescription>
                <FileUpload
                  onChange={handleNewAttachments}
                  maxFiles={maxNewFiles}
                  disabled={isSubmitting || maxNewFiles === 0}
                />
              </div>

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
