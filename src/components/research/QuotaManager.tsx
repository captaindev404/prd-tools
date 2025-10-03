'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, X, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { Quota, QuotaWithProgress, QuotaValidation, QuotaKey } from '@/types/panel';

// Validation schema for adding a quota
const quotaSchema = z.object({
  key: z.string().min(1, 'Quota key is required'),
  targetPercentage: z
    .number()
    .min(0, 'Percentage must be at least 0')
    .max(100, 'Percentage cannot exceed 100'),
});

type QuotaFormValues = z.infer<typeof quotaSchema>;

/**
 * Available quota keys with labels
 */
const QUOTA_KEY_OPTIONS: Array<{ value: QuotaKey; label: string }> = [
  { value: 'department', label: 'Department' },
  { value: 'role', label: 'Role' },
  { value: 'village_id', label: 'Village' },
  { value: 'seniority', label: 'Seniority' },
  { value: 'location', label: 'Location' },
];

/**
 * Props for QuotaManager component
 */
interface QuotaManagerProps {
  /** Current quotas */
  quotas?: Quota[];

  /** Quotas with progress (optional - for showing current state) */
  quotasWithProgress?: QuotaWithProgress[];

  /** Callback when quotas change */
  onChange?: (quotas: Quota[]) => void;

  /** Whether the component is in read-only mode */
  readOnly?: boolean;

  /** Total member count for calculating target counts */
  totalMembers?: number;

  /** Custom quota key options */
  customKeyOptions?: Array<{ value: string; label: string }>;
}

/**
 * Validates quota configuration
 */
function validateQuotas(quotas: Quota[]): QuotaValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Calculate total percentage
  const totalPercentage = quotas.reduce((sum, quota) => sum + quota.targetPercentage, 0);

  // Check for duplicate keys
  const keys = quotas.map(q => q.key);
  const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate quota keys found: ${duplicates.join(', ')}`);
  }

  // Validate total percentage
  if (Math.abs(totalPercentage - 100) > 5) {
    errors.push(`Total percentage (${totalPercentage.toFixed(1)}%) should be approximately 100%`);
  } else if (Math.abs(totalPercentage - 100) > 0.1) {
    warnings.push(`Total percentage (${totalPercentage.toFixed(1)}%) is slightly off from 100%`);
  }

  // Check for empty quotas
  if (quotas.length === 0) {
    warnings.push('No quotas configured');
  }

  return {
    isValid: errors.length === 0,
    totalPercentage,
    errors,
    warnings,
  };
}

/**
 * Get compliance status based on current vs target percentage
 */
function getComplianceStatus(current: number, target: number): {
  status: 'good' | 'warning' | 'critical';
  color: string;
} {
  const diff = Math.abs(current - target);

  if (diff <= 5) {
    return { status: 'good', color: 'text-green-600' };
  } else if (diff <= 10) {
    return { status: 'warning', color: 'text-yellow-600' };
  } else {
    return { status: 'critical', color: 'text-red-600' };
  }
}

/**
 * QuotaManager Component
 *
 * Manages demographic quotas for research panels to ensure representative sampling.
 * Displays current vs target percentages with visual progress bars and compliance indicators.
 */
export function QuotaManager({
  quotas = [],
  quotasWithProgress,
  onChange,
  readOnly = false,
  totalMembers,
  customKeyOptions,
}: QuotaManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [internalQuotas, setInternalQuotas] = React.useState<Quota[]>(quotas);

  // Update internal state when props change
  React.useEffect(() => {
    setInternalQuotas(quotas);
  }, [quotas]);

  const keyOptions = customKeyOptions || QUOTA_KEY_OPTIONS;

  const form = useForm<QuotaFormValues>({
    resolver: zodResolver(quotaSchema),
    defaultValues: {
      key: '',
      targetPercentage: 0,
    },
  });

  // Validate current quotas
  const validation = validateQuotas(internalQuotas);

  // Handle adding a new quota
  const handleAddQuota = (values: QuotaFormValues) => {
    const newQuota: Quota = {
      id: `quota_${Date.now()}`,
      key: values.key,
      targetPercentage: values.targetPercentage,
    };

    const updatedQuotas = [...internalQuotas, newQuota];
    setInternalQuotas(updatedQuotas);

    if (onChange) {
      onChange(updatedQuotas);
    }

    // Reset form and close dialog
    form.reset();
    setIsDialogOpen(false);
  };

  // Handle removing a quota
  const handleRemoveQuota = (quotaId: string) => {
    const updatedQuotas = internalQuotas.filter(q => q.id !== quotaId);
    setInternalQuotas(updatedQuotas);

    if (onChange) {
      onChange(updatedQuotas);
    }
  };

  // Determine which quotas to display
  const displayQuotas = quotasWithProgress || internalQuotas.map(q => ({
    ...q,
    currentCount: 0,
    currentPercentage: 0,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quota Management</CardTitle>
            <CardDescription>
              Configure demographic quotas to ensure representative sampling
            </CardDescription>
          </div>

          {!readOnly && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" aria-label="Add new quota">
                  <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                  Add Quota
                </Button>
              </DialogTrigger>
              <DialogContent aria-describedby="quota-dialog-description">
                <DialogHeader>
                  <DialogTitle>Add Quota</DialogTitle>
                  <DialogDescription id="quota-dialog-description">
                    Define a demographic quota for representative sampling
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleAddQuota)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="key"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quota Key</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger aria-required="true" aria-invalid={!!form.formState.errors.key}>
                                <SelectValue placeholder="Select a quota key" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {keyOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription id="quota-key-help">
                            The demographic attribute to track
                          </FormDescription>
                          <FormMessage role="alert" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="targetPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Percentage</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              placeholder="e.g., 25"
                              aria-required="true"
                              aria-invalid={!!form.formState.errors.targetPercentage}
                              aria-describedby="target-percentage-help"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription id="target-percentage-help">
                            Target percentage for this demographic (0-100)
                          </FormDescription>
                          <FormMessage role="alert" />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="submit" aria-label="Add quota to panel">Add Quota</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Validation Status */}
        <div role="status" aria-live="polite" aria-atomic="true">
          {!validation.isValid && validation.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Validation Errors</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1" role="list">
                  {validation.errors.map((error, index) => (
                    <li key={index} role="listitem">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {validation.warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Warnings</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1" role="list">
                  {validation.warnings.map((warning, index) => (
                    <li key={index} role="listitem">{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {validation.isValid && internalQuotas.length > 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
              <AlertTitle className="text-green-900">Quota Configuration Valid</AlertTitle>
              <AlertDescription className="text-green-800">
                Total percentage: {validation.totalPercentage.toFixed(1)}%
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Quota List */}
        {displayQuotas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" role="status">
            <p>No quotas configured yet.</p>
            {!readOnly && (
              <p className="text-sm mt-2">Click "Add Quota" to create your first quota.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3" role="list" aria-label="Configured quotas">
            {displayQuotas.map((quota) => {
              const keyLabel = keyOptions.find(opt => opt.value === quota.key)?.label || quota.key;
              const compliance = getComplianceStatus(
                quota.currentPercentage || 0,
                quota.targetPercentage
              );

              return (
                <div
                  key={quota.id}
                  className="border rounded-lg p-4 space-y-3"
                  role="listitem"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium" id={`quota-${quota.id}-label`}>{keyLabel}</h4>
                        {quotasWithProgress && (
                          <span className={cn('text-sm font-medium', compliance.color)} aria-label={`Current ${quota.currentPercentage?.toFixed(1)}% of target ${quota.targetPercentage}%`}>
                            {quota.currentPercentage?.toFixed(1)}% / {quota.targetPercentage}%
                          </span>
                        )}
                      </div>

                      {totalMembers && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {quotasWithProgress ? (
                            <>
                              {quota.currentCount || 0} of {Math.round((quota.targetPercentage / 100) * totalMembers)} members
                            </>
                          ) : (
                            <>
                              Target: {Math.round((quota.targetPercentage / 100) * totalMembers)} members
                            </>
                          )}
                        </p>
                      )}
                    </div>

                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveQuota(quota.id)}
                        className="h-8 w-8 p-0"
                        aria-label={`Remove ${keyLabel} quota`}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Remove quota</span>
                      </Button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {quotasWithProgress && (
                    <div className="space-y-1" role="region" aria-labelledby={`quota-${quota.id}-label`}>
                      <Progress
                        value={(quota.currentPercentage || 0) / quota.targetPercentage * 100}
                        className={cn(
                          'h-2',
                          compliance.status === 'good' && '[&>div]:bg-green-600',
                          compliance.status === 'warning' && '[&>div]:bg-yellow-600',
                          compliance.status === 'critical' && '[&>div]:bg-red-600'
                        )}
                        aria-label={`${keyLabel} quota progress: ${quota.currentPercentage?.toFixed(1)}% of ${quota.targetPercentage}% target`}
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground" aria-hidden="true">
                        <span>Current: {quota.currentPercentage?.toFixed(1)}%</span>
                        <span>Target: {quota.targetPercentage}%</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {internalQuotas.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Total Percentage:</span>
              <span className={cn(
                'font-bold',
                validation.isValid ? 'text-green-600' : 'text-red-600'
              )}>
                {validation.totalPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
