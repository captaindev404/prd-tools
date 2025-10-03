'use client';

import { useState } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import type { Role } from '@prisma/client';

const AVAILABLE_ROLES: Role[] = ['USER', 'PM', 'PO', 'RESEARCHER', 'ADMIN', 'MODERATOR'];
const AVAILABLE_CONSENTS = [
  { value: 'research_contact', label: 'Research Contact' },
  { value: 'usage_analytics', label: 'Usage Analytics' },
  { value: 'email_updates', label: 'Email Updates' },
];

// Step 1 Schema: Basic Information
const step1Schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name must not exceed 100 characters'),
  description: z.string().max(1000, 'Description must not exceed 1000 characters').optional(),
});

// Step 2 Schema: Eligibility Rules
const step2Schema = z.object({
  includeRoles: z.array(z.enum(['USER', 'PM', 'PO', 'RESEARCHER', 'ADMIN', 'MODERATOR'] as const)).optional(),
  includeVillages: z.string().optional(),
  requiredConsents: z.array(z.string()).optional(),
  minTenureDays: z.number().int().min(0, 'Tenure must be non-negative').optional().nullable(),
});

// Step 3 Schema: Size and Quotas
const step3Schema = z.object({
  sizeTarget: z.number().int().positive('Size target must be a positive number').optional().nullable(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

/**
 * PanelWizard Component
 *
 * Multi-step wizard for creating research panels with:
 * - Step 1: Basic panel information (name, description)
 * - Step 2: Eligibility rules (roles, villages, consents, tenure)
 * - Step 3: Size targets and quotas
 *
 * Features:
 * - Step-by-step navigation with validation
 * - Visual progress indicator
 * - Form persistence across steps
 * - Accessible keyboard navigation
 */
export function PanelWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 Form
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: step1Data || {
      name: '',
      description: '',
    },
  });

  // Step 2 Form
  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: step2Data || {
      includeRoles: [],
      includeVillages: '',
      requiredConsents: [],
      minTenureDays: null,
    },
  });

  // Step 3 Form
  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      sizeTarget: null,
    },
  });

  /**
   * Handle Step 1 submission and move to Step 2
   */
  const handleStep1Next = (data: Step1Data) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  /**
   * Handle Step 2 submission and move to Step 3
   */
  const handleStep2Next = (data: Step2Data) => {
    setStep2Data(data);
    setCurrentStep(3);
  };

  /**
   * Build eligibility rules object from step 2 data
   */
  const buildEligibilityRules = (data: Step2Data) => {
    const rules: any = {};

    if (data.includeRoles && data.includeRoles.length > 0) {
      rules.include_roles = data.includeRoles;
    }

    if (data.includeVillages) {
      rules.include_villages = data.includeVillages
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    }

    if (data.requiredConsents && data.requiredConsents.length > 0) {
      rules.required_consents = data.requiredConsents;
    }

    if (data.minTenureDays !== null && data.minTenureDays !== undefined) {
      rules.min_tenure_days = data.minTenureDays;
    }

    return rules;
  };

  /**
   * Handle final submission
   */
  const handleFinalSubmit = async (data: Step3Data) => {
    if (!step1Data || !step2Data) return;

    setIsSubmitting(true);

    try {
      const eligibilityRules = buildEligibilityRules(step2Data);

      const response = await fetch('/api/panels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: step1Data.name,
          description: step1Data.description || null,
          eligibilityRules,
          sizeTarget: data.sizeTarget || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create panel');
      }

      toast({
        title: 'Panel created',
        description: `Panel "${result.data.name}" has been created successfully.`,
      });

      router.push(`/research/panels/${result.data.id}`);
    } catch (error: any) {
      console.error('Error creating panel:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create panel. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Step Progress Indicator
   */
  const StepIndicator = () => (
    <div className="mb-8 flex items-center justify-center space-x-4">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
              step === currentStep
                ? 'border-primary bg-primary text-primary-foreground'
                : step < currentStep
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-muted-foreground/30 text-muted-foreground'
            }`}
            aria-current={step === currentStep ? 'step' : undefined}
          >
            {step < currentStep ? <Check className="h-5 w-5" /> : step}
          </div>
          {step < 3 && (
            <div
              className={`h-0.5 w-16 transition-colors ${
                step < currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {/* Step Progress Indicator */}
      <StepIndicator />

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Panel Details</CardTitle>
            <CardDescription>
              Provide a name and description for your research panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...step1Form}>
              <form onSubmit={step1Form.handleSubmit(handleStep1Next)} className="space-y-6">
                <FormField
                  control={step1Form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Panel Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Early Adopters, Mobile Users, Power Users" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for this research panel (3-100 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step1Form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the purpose and criteria for this panel..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional description to help identify the panel's purpose (max 1000 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button type="submit">
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Eligibility Rules */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Eligibility Rules</CardTitle>
            <CardDescription>
              Define who can join this research panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...step2Form}>
              <form onSubmit={step2Form.handleSubmit(handleStep2Next)} className="space-y-6">
                <FormField
                  control={step2Form.control}
                  name="includeRoles"
                  render={() => (
                    <FormItem>
                      <FormLabel>Required Roles</FormLabel>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        {AVAILABLE_ROLES.map((role) => (
                          <FormField
                            key={role}
                            control={step2Form.control}
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
                                  <FormLabel className="font-normal cursor-pointer">
                                    {role}
                                  </FormLabel>
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
                  control={step2Form.control}
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
                  control={step2Form.control}
                  name="requiredConsents"
                  render={() => (
                    <FormItem>
                      <FormLabel>Required Consents</FormLabel>
                      <div className="space-y-3 mt-2">
                        {AVAILABLE_CONSENTS.map((consent) => (
                          <FormField
                            key={consent.value}
                            control={step2Form.control}
                            name="requiredConsents"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={consent.value}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(consent.value)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), consent.value])
                                          : field.onChange(
                                              field.value?.filter((value) => value !== consent.value)
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {consent.label}
                                  </FormLabel>
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
                  control={step2Form.control}
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
                        Minimum number of days since account creation (leave empty for no requirement)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button type="submit">
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Size and Quotas */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Panel Size & Quotas</CardTitle>
            <CardDescription>
              Set target size and quotas for your panel (optional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...step3Form}>
              <form onSubmit={step3Form.handleSubmit(handleFinalSubmit)} className="space-y-6">
                <FormField
                  control={step3Form.control}
                  name="sizeTarget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Panel Size (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 100"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormDescription>
                        Target number of panel members (leave empty for no limit)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-lg border border-muted bg-muted/50 p-4">
                  <h4 className="font-medium mb-2">Summary</h4>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Panel Name:</dt>
                      <dd className="font-medium">{step1Data?.name}</dd>
                    </div>
                    {step2Data?.includeRoles && step2Data.includeRoles.length > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Roles:</dt>
                        <dd className="font-medium">{step2Data.includeRoles.join(', ')}</dd>
                      </div>
                    )}
                    {step2Data?.requiredConsents && step2Data.requiredConsents.length > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Required Consents:</dt>
                        <dd className="font-medium">{step2Data.requiredConsents.length}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    disabled={isSubmitting}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Creating Panel...' : 'Create Panel'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
