'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import type { RoadmapItem } from '@/types/roadmap';
import type { RoadmapStage, Visibility } from '@prisma/client';
import { validateJiraUrl, generateJiraUrl } from '@/lib/validators/jira';
import { validateFigmaUrl } from '@/lib/validators/figma';

const formSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters'),
  description: z.string().optional(),
  stage: z.enum(['now', 'next', 'later', 'under_consideration']),
  targetDate: z.string().optional(),
  progress: z.number().min(0).max(100),
  visibility: z.enum(['public', 'internal']),
  jiraTickets: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    const tickets = val.split(',').map((t) => t.trim()).filter(Boolean);
    return tickets.every((ticket) => {
      // Support both full URLs and ticket keys (e.g., "ODYS-123" or full URL)
      if (ticket.startsWith('http')) {
        return validateJiraUrl(ticket);
      }
      // Convert ticket key to URL for validation
      const url = generateJiraUrl(ticket);
      return validateJiraUrl(url);
    });
  }, {
    message: 'Invalid Jira URL format. Expected: https://jira.company.com/browse/(ODYS|PMS)-{number} or ticket key (e.g., ODYS-123)',
  }),
  figmaLinks: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    const links = val.split(/[\n,]/).map((l) => l.trim()).filter(Boolean);
    return links.every((link) => validateFigmaUrl(link));
  }, {
    message: 'Invalid Figma URL format. Expected: https://figma.com/(file|proto|design)/{id}',
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface RoadmapFormProps {
  roadmapItem?: RoadmapItem;
  isEdit?: boolean;
}

export function RoadmapForm({ roadmapItem, isEdit = false }: RoadmapFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: roadmapItem?.title || '',
      description: roadmapItem?.description || '',
      stage: roadmapItem?.stage || 'under_consideration',
      targetDate: roadmapItem?.targetDate
        ? new Date(roadmapItem.targetDate).toISOString().split('T')[0]
        : '',
      progress: roadmapItem?.progress || 0,
      visibility: roadmapItem?.visibility || 'public',
      jiraTickets: roadmapItem?.jiraTickets?.join(', ') || '',
      figmaLinks: roadmapItem?.figmaLinks?.join(', ') || '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Parse comma-separated values
      const jiraTickets = values.jiraTickets
        ? values.jiraTickets.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      const figmaLinks = values.figmaLinks
        ? values.figmaLinks.split(',').map((l) => l.trim()).filter(Boolean)
        : [];

      const payload = {
        title: values.title,
        description: values.description || null,
        stage: values.stage as RoadmapStage,
        targetDate: values.targetDate || null,
        progress: values.progress,
        visibility: values.visibility as Visibility,
        jiraTickets,
        figmaLinks,
      };

      const url = isEdit
        ? `/api/roadmap/${roadmapItem!.id}`
        : '/api/roadmap';
      const method = isEdit ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save roadmap item');
      }

      const data = await response.json();

      // Redirect to roadmap detail page
      router.push(`/roadmap/${data.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input placeholder="Enter roadmap title" {...field} />
              </FormControl>
              <FormDescription>
                A clear, concise title for the roadmap item (3-200 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe this roadmap item..."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide details about what this roadmap item entails
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stage */}
          <FormField
            control={form.control}
            name="stage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stage *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a stage" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="now">Now</SelectItem>
                    <SelectItem value="next">Next</SelectItem>
                    <SelectItem value="later">Later</SelectItem>
                    <SelectItem value="under_consideration">
                      Under Consideration
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Current stage of this roadmap item</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Target Date */}
          <FormField
            control={form.control}
            name="targetDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormDescription>Expected completion date</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Progress */}
        <FormField
          control={form.control}
          name="progress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Progress: {field.value}%</FormLabel>
              <FormControl>
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={[field.value]}
                  onValueChange={(value) => field.onChange(value[0])}
                  className="w-full"
                />
              </FormControl>
              <FormDescription>
                Current progress towards completion (0-100%)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Visibility */}
        <FormField
          control={form.control}
          name="visibility"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Visibility *</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="public" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Public - Visible to all users
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="internal" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Internal - Only visible to PM/PO/ADMIN
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Jira Tickets */}
        <FormField
          control={form.control}
          name="jiraTickets"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jira Tickets</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., ODYS-123, PMS-456 or full URLs"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Comma-separated Jira ticket keys (ODYS-123, PMS-456) or full URLs. Only ODYS and PMS projects allowed.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Figma Links */}
        <FormField
          control={form.control}
          name="figmaLinks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Figma Links</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="https://www.figma.com/file/..."
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Comma-separated Figma URLs (file, proto, or design). One per line or comma-separated.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>{isEdit ? 'Update' : 'Create'} Roadmap Item</>
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
  );
}
