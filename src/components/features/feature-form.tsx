'use client';

import { useState } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import type { ProductArea, FeatureStatus } from '@prisma/client';

const featureFormSchema = z.object({
  title: z
    .string()
    .min(3, { message: 'Title must be at least 3 characters' })
    .max(100, { message: 'Title must not exceed 100 characters' }),
  description: z
    .string()
    .max(2000, { message: 'Description must not exceed 2000 characters' })
    .optional(),
  area: z.enum(['Reservations', 'CheckIn', 'Payments', 'Housekeeping', 'Backoffice']),
  status: z.enum([
    'idea',
    'discovery',
    'shaping',
    'in_progress',
    'released',
    'generally_available',
    'deprecated',
  ]),
});

export type FeatureFormValues = z.infer<typeof featureFormSchema>;

interface FeatureFormProps {
  initialData?: Partial<FeatureFormValues>;
  featureId?: string;
  onSuccess?: (featureId: string) => void;
}

export function FeatureForm({ initialData, featureId, onSuccess }: FeatureFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FeatureFormValues>({
    resolver: zodResolver(featureFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      area: initialData?.area || undefined,
      status: initialData?.status || 'idea',
    },
  });

  const onSubmit = async (values: FeatureFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = featureId ? `/api/features/${featureId}` : '/api/features';
      const method = featureId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save feature');
      }

      const data = await response.json();

      if (onSuccess) {
        onSuccess(data.data.id);
      } else {
        router.push(`/features/${data.data.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input placeholder="Enter feature title" {...field} />
              </FormControl>
              <FormDescription>
                A clear, concise title for the feature (3-100 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide a detailed description of the feature"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional detailed description (max 2000 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Area *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product area" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Reservations">Reservations</SelectItem>
                    <SelectItem value="CheckIn">Check-in</SelectItem>
                    <SelectItem value="Payments">Payments</SelectItem>
                    <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                    <SelectItem value="Backoffice">Backoffice</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  The product area this feature belongs to
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="idea">Idea</SelectItem>
                    <SelectItem value="discovery">Discovery</SelectItem>
                    <SelectItem value="shaping">Shaping</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="released">Released</SelectItem>
                    <SelectItem value="generally_available">Generally Available</SelectItem>
                    <SelectItem value="deprecated">Deprecated</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Current development status of the feature
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {featureId ? 'Update Feature' : 'Create Feature'}
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
