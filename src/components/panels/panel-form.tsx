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
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Role } from '@prisma/client';
import {
  VALID_ROLES,
  VALID_CONSENTS,
  eligibilityRulesSchema,
} from '@/lib/validators/panel-eligibility';
import { handleApiError } from '@/lib/api-error-handler';

const AVAILABLE_ROLES: Role[] = [...VALID_ROLES];
const AVAILABLE_CONSENTS = [...VALID_CONSENTS];

// Form schema with integrated eligibility validation
const formSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must not exceed 100 characters'),
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  sizeTarget: z
    .number()
    .int('Size target must be a whole number')
    .positive('Size target must be a positive number')
    .optional()
    .nullable(),
  includeRoles: z
    .array(z.enum(VALID_ROLES))
    .optional()
    .refine(
      (roles) => !roles || roles.length > 0,
      { message: 'If roles are selected, at least one role is required' }
    ),
  includeVillages: z.string().optional(),
  requiredConsents: z
    .array(z.enum(VALID_CONSENTS))
    .optional()
    .refine(
      (consents) => !consents || consents.length > 0,
      { message: 'If consents are selected, at least one consent is required' }
    ),
  minTenureDays: z
    .number()
    .int('Tenure must be a whole number')
    .min(0, 'Tenure must be non-negative')
    .optional()
    .nullable(),
}).refine(
  (data) => {
    // At least one eligibility criterion must be specified
    const hasRoles = data.includeRoles && data.includeRoles.length > 0;
    const hasVillages = data.includeVillages && data.includeVillages.trim().length > 0;
    const hasConsents = data.requiredConsents && data.requiredConsents.length > 0;
    const hasTenure = data.minTenureDays !== null && data.minTenureDays !== undefined;

    return hasRoles || hasVillages || hasConsents || hasTenure;
  },
  {
    message: 'At least one eligibility criterion must be specified (roles, villages, consents, or tenure)',
    path: ['includeRoles'],
  }
);

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
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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
      rules.includeRoles = values.includeRoles;
    }

    if (values.includeVillages) {
      const villages = values.includeVillages
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
      if (villages.length > 0) {
        rules.includeVillages = villages;
      }
    }

    if (values.requiredConsents && values.requiredConsents.length > 0) {
      rules.requiredConsents = values.requiredConsents;
    }

    // Note: minTenureDays is a custom field not in the DSL eligibility schema
    // It would need to be added to attributesPredicates if used

    return rules;
  };

  // Check if form has validation errors
  const hasValidationErrors = () => {
    return Object.keys(form.formState.errors).length > 0 || validationErrors.length > 0;
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      setValidationErrors([]);

      // Build and validate eligibility rules
      const eligibilityRules = buildEligibilityRules(values);

      // Validate eligibility rules against schema
      const validationResult = eligibilityRulesSchema.safeParse(eligibilityRules);

      if (!validationResult.success) {
        const errors = validationResult.error.issues.map((err) => err.message);
        setValidationErrors(errors);
        toast({
          title: 'Validation Error',
          description: 'Please fix the eligibility criteria errors before submitting',
          variant: 'destructive',
        });
        return;
      }

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

      if (!response.ok) {
        throw response;
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: result.message || `Panel ${mode === 'create' ? 'created' : 'updated'} successfully`,
      });

      router.push(`/research/panels/${result.data.id}`);
    } catch (err) {
      const errorResult = await handleApiError(err, {
        context: mode === 'create' ? 'Creating panel' : 'Updating panel',
      });

      toast({
        title: `Error ${mode === 'create' ? 'creating' : 'updating'} panel`,
        description: errorResult.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">Eligibility Criteria Validation Errors:</div>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

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
          <Button
            type="submit"
            disabled={loading || hasValidationErrors()}
          >
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

        {hasValidationErrors() && !loading && (
          <p className="text-sm text-destructive">
            Please fix all validation errors before submitting
          </p>
        )}
      </form>
    </Form>
  );
}
