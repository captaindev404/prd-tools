'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { Role } from '@prisma/client';

const AVAILABLE_ROLES: Role[] = ['USER', 'PM', 'PO', 'RESEARCHER', 'ADMIN', 'MODERATOR'];
const AVAILABLE_CONSENTS = ['research_contact', 'usage_analytics', 'email_updates'];

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name must not exceed 100 characters'),
  description: z.string().max(1000, 'Description must not exceed 1000 characters').optional(),
  sizeTarget: z.number().int().positive('Size target must be a positive number').optional().nullable(),
  includeRoles: z.array(z.enum(['USER', 'PM', 'PO', 'RESEARCHER', 'ADMIN', 'MODERATOR'] as const)).optional(),
  includeVillages: z.string().optional(),
  requiredConsents: z.array(z.string()).optional(),
  minTenureDays: z.number().int().min(0, 'Tenure must be non-negative').optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface PanelFormProps {
  initialData?: {
    id?: string;
    name?: string;
    description?: string | null;
    sizeTarget?: number | null;
    eligibilityRules?: string;
  };
  mode: 'create' | 'edit';
}

export function PanelForm({ initialData, mode }: PanelFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [eligibleCount, setEligibleCount] = useState<number | null>(null);

  // Parse initial eligibility rules
  const parseEligibilityRules = () => {
    if (!initialData?.eligibilityRules) {
      return {
        includeRoles: [],
        includeVillages: '',
        requiredConsents: [],
        minTenureDays: null,
      };
    }

    try {
      const rules = JSON.parse(initialData.eligibilityRules);
      return {
        includeRoles: rules.include_roles || [],
        includeVillages: (rules.include_villages || []).join(', '),
        requiredConsents: rules.required_consents || [],
        minTenureDays: rules.min_tenure_days || null,
      };
    } catch {
      return {
        includeRoles: [],
        includeVillages: '',
        requiredConsents: [],
        minTenureDays: null,
      };
    }
  };

  const eligibilityDefaults = parseEligibilityRules();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      sizeTarget: initialData?.sizeTarget || null,
      includeRoles: eligibilityDefaults.includeRoles,
      includeVillages: eligibilityDefaults.includeVillages,
      requiredConsents: eligibilityDefaults.requiredConsents,
      minTenureDays: eligibilityDefaults.minTenureDays,
    },
  });

  const buildEligibilityRules = (values: FormValues) => {
    const rules: any = {};

    if (values.includeRoles && values.includeRoles.length > 0) {
      rules.include_roles = values.includeRoles;
    }

    if (values.includeVillages) {
      rules.include_villages = values.includeVillages
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    }

    if (values.requiredConsents && values.requiredConsents.length > 0) {
      rules.required_consents = values.requiredConsents;
    }

    if (values.minTenureDays !== null && values.minTenureDays !== undefined) {
      rules.min_tenure_days = values.minTenureDays;
    }

    return rules;
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);

      const eligibilityRules = buildEligibilityRules(values);

      const payload = {
        name: values.name,
        description: values.description || null,
        sizeTarget: values.sizeTarget || null,
        eligibilityRules,
      };

      const url = mode === 'create' ? '/api/panels' : `/api/panels/${initialData?.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save panel');
      }

      toast({
        title: 'Success',
        description: result.message || `Panel ${mode === 'create' ? 'created' : 'updated'} successfully`,
      });

      router.push(`/research/panels/${result.data.id}`);
    } catch (error: any) {
      console.error('Error saving panel:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save panel',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Panel Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Research Panel Name" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this research panel (3-100 characters)
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
                      placeholder="Describe the purpose of this panel..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description (max 1000 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sizeTarget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Panel Size</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 150"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional maximum number of panel members
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Eligibility Criteria</h3>
              <p className="text-sm text-muted-foreground">
                Define who can be invited to this panel
              </p>
            </div>

            <FormField
              control={form.control}
              name="includeRoles"
              render={() => (
                <FormItem>
                  <FormLabel>Required Roles</FormLabel>
                  <div className="space-y-2">
                    {AVAILABLE_ROLES.map((role) => (
                      <FormField
                        key={role}
                        control={form.control}
                        name="includeRoles"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={role}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(role)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), role])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== role)
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{role}</FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormDescription>
                    Leave empty to allow all roles
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="includeVillages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Villages</FormLabel>
                  <FormControl>
                    <Input placeholder="vlg-001, vlg-002 or 'all'" {...field} />
                  </FormControl>
                  <FormDescription>
                    Comma-separated village IDs, or 'all' for all villages
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requiredConsents"
              render={() => (
                <FormItem>
                  <FormLabel>Required Consents</FormLabel>
                  <div className="space-y-2">
                    {AVAILABLE_CONSENTS.map((consent) => (
                      <FormField
                        key={consent}
                        control={form.control}
                        name="requiredConsents"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={consent}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(consent)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), consent])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== consent)
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{consent}</FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormDescription>
                    Users must have granted these consents to be eligible
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minTenureDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Tenure (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 90"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum number of days since account creation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Create Panel' : 'Update Panel'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
