'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar as CalendarIcon, Users } from 'lucide-react';
import { format } from 'date-fns';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { MultiSelect, type Option } from '@/components/ui/multi-select';
import { cn } from '@/lib/utils';
import type { Role } from '@prisma/client';

// Validation schema
const targetingSchema = z.object({
  // Panel targeting
  panelIds: z.array(z.string()).optional(),

  // Ad-hoc filters
  villageIds: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional(),
  featureInteractions: z.array(z.string()).optional(),

  // Delivery configuration
  deliveryModes: z.array(z.enum(['in-app', 'email'])).min(1, 'Select at least one delivery mode'),

  // Schedule
  startAt: z.date().optional().nullable(),
  endAt: z.date().optional().nullable(),

  // Response limits
  maxResponses: z.number().int().positive('Maximum responses must be positive').optional().nullable(),
}).refine(
  (data) => {
    // At least one targeting method must be selected
    const hasPanels = data.panelIds && data.panelIds.length > 0;
    const hasAdHocFilters =
      (data.villageIds && data.villageIds.length > 0) ||
      (data.roles && data.roles.length > 0) ||
      (data.featureInteractions && data.featureInteractions.length > 0);

    return hasPanels || hasAdHocFilters;
  },
  {
    message: 'At least one targeting method must be selected (panels or ad-hoc filters)',
    path: ['panelIds'],
  }
).refine(
  (data) => {
    // If both dates are set, startAt must be before endAt
    if (data.startAt && data.endAt) {
      return data.startAt < data.endAt;
    }
    return true;
  },
  {
    message: 'Start date must be before end date',
    path: ['endAt'],
  }
);

export type TargetingConfigValues = z.infer<typeof targetingSchema>;

interface TargetingConfigProps {
  // Available options for dropdowns
  panels?: Array<{ id: string; name: string }>;
  villages?: Array<{ id: string; name: string }>;
  features?: Array<{ id: string; name: string }>;

  // Initial values
  initialValues?: Partial<TargetingConfigValues>;

  // Callbacks
  onSubmit?: (values: TargetingConfigValues) => void;
  onChange?: (values: Partial<TargetingConfigValues>) => void;
  onPreviewAudience?: () => void;

  // State
  isLoading?: boolean;
  audienceCount?: number | null;

  // Display options
  showSubmitButton?: boolean;
  submitButtonText?: string;
}

const AVAILABLE_ROLES: Role[] = ['USER', 'PM', 'PO', 'RESEARCHER', 'ADMIN', 'MODERATOR'];

const DELIVERY_MODES = [
  { id: 'in-app', label: 'In-App' },
  { id: 'email', label: 'Email' },
] as const;

export function TargetingConfig({
  panels = [],
  villages = [],
  features = [],
  initialValues,
  onSubmit,
  onChange,
  onPreviewAudience,
  isLoading = false,
  audienceCount = null,
  showSubmitButton = true,
  submitButtonText = 'Save Targeting',
}: TargetingConfigProps) {
  const form = useForm<TargetingConfigValues>({
    resolver: zodResolver(targetingSchema),
    defaultValues: {
      panelIds: initialValues?.panelIds || [],
      villageIds: initialValues?.villageIds || [],
      roles: initialValues?.roles || [],
      featureInteractions: initialValues?.featureInteractions || [],
      deliveryModes: initialValues?.deliveryModes || ['in-app'],
      startAt: initialValues?.startAt || null,
      endAt: initialValues?.endAt || null,
      maxResponses: initialValues?.maxResponses || null,
    },
  });

  // Convert data to options format for MultiSelect
  const panelOptions: Option[] = panels.map((p) => ({ label: p.name, value: p.id }));
  const villageOptions: Option[] = villages.map((v) => ({ label: v.name, value: v.id }));
  const roleOptions: Option[] = AVAILABLE_ROLES.map((r) => ({ label: r, value: r }));
  const featureOptions: Option[] = features.map((f) => ({ label: f.name, value: f.id }));

  // Watch for changes to notify parent
  React.useEffect(() => {
    if (onChange) {
      const subscription = form.watch((values) => {
        onChange(values as Partial<TargetingConfigValues>);
      });
      return () => subscription.unsubscribe();
    }
  }, [form, onChange]);

  const handleSubmit = (values: TargetingConfigValues) => {
    if (onSubmit) {
      onSubmit(values);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Panel Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Panel Targeting</CardTitle>
            <CardDescription>
              Select research panels to target with this questionnaire
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="panelIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Research Panels</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={panelOptions}
                      selected={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select panels..."
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Users in selected panels will receive this questionnaire
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Ad-hoc Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Ad-Hoc Filters</CardTitle>
            <CardDescription>
              Define custom audience filters for this questionnaire
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="villageIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Villages</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={villageOptions}
                      selected={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select villages..."
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Target specific villages
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Roles</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={roleOptions}
                      selected={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select roles..."
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Target users with specific roles
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="featureInteractions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feature Interactions</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={featureOptions}
                      selected={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select features..."
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Target users who have interacted with specific features
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Delivery Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Configuration</CardTitle>
            <CardDescription>
              Configure how and when to deliver this questionnaire
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="deliveryModes"
              render={() => (
                <FormItem>
                  <FormLabel>Delivery Modes *</FormLabel>
                  <div className="space-y-2">
                    {DELIVERY_MODES.map((mode) => (
                      <FormField
                        key={mode.id}
                        control={form.control}
                        name="deliveryModes"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={mode.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(mode.id as any)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), mode.id])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== mode.id)
                                        );
                                  }}
                                  disabled={isLoading}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{mode.label}</FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormDescription>
                    Select at least one delivery method
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                            disabled={isLoading}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                        {field.value && (
                          <div className="p-3 border-t">
                            <Button
                              variant="ghost"
                              className="w-full"
                              onClick={() => field.onChange(null)}
                            >
                              Clear date
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When to start showing this questionnaire
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                            disabled={isLoading}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                        {field.value && (
                          <div className="p-3 border-t">
                            <Button
                              variant="ghost"
                              className="w-full"
                              onClick={() => field.onChange(null)}
                            >
                              Clear date
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When to stop showing this questionnaire
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="maxResponses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Responses (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 500"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Stop collecting responses after reaching this limit
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Preview Audience */}
        {onPreviewAudience && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Estimated Audience</p>
                    {audienceCount !== null ? (
                      <p className="text-2xl font-bold">{audienceCount.toLocaleString()}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not calculated yet</p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onPreviewAudience}
                  disabled={isLoading}
                >
                  Preview Audience
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        {showSubmitButton && (
          <div className="flex justify-end gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : submitButtonText}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
