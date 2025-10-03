'use client';

import * as React from 'react';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { QuotaWithProgress } from '@/types/panel';
import { CheckCircle2, AlertTriangle, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Legend } from 'recharts';

/**
 * Visualization mode for quota progress
 */
type VisualizationMode = 'bars' | 'pie';

/**
 * Props for QuotaProgressVisualization component
 */
interface QuotaProgressVisualizationProps {
  /** Quotas with current progress data */
  quotas: QuotaWithProgress[];

  /** Total members in the panel (for calculating target counts) */
  totalMembers?: number;

  /** Visualization mode - progress bars or pie chart */
  mode?: VisualizationMode;

  /** Optional title for the card */
  title?: string;

  /** Optional description for the card */
  description?: string;

  /** Show as compact view (without card wrapper) */
  compact?: boolean;

  /** Custom quota key labels */
  keyLabels?: Record<string, string>;
}

/**
 * Default labels for quota keys
 */
const DEFAULT_KEY_LABELS: Record<string, string> = {
  department: 'Department',
  role: 'Role',
  village_id: 'Village',
  seniority: 'Seniority',
  location: 'Location',
};

/**
 * Determine compliance status based on deviation from target
 */
function getComplianceStatus(currentPercentage: number, targetPercentage: number): {
  status: 'good' | 'warning' | 'critical';
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  label: string;
} {
  const deviation = Math.abs(currentPercentage - targetPercentage);

  if (deviation <= 5) {
    return {
      status: 'good',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: 'On target',
    };
  } else if (deviation <= 15) {
    return {
      status: 'warning',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: <AlertTriangle className="h-4 w-4" />,
      label: 'Close to target',
    };
  } else {
    return {
      status: 'critical',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: <AlertCircle className="h-4 w-4" />,
      label: 'Off target',
    };
  }
}

/**
 * Get progress bar color based on compliance status
 */
function getProgressBarColor(status: 'good' | 'warning' | 'critical'): string {
  switch (status) {
    case 'good':
      return '[&>div]:bg-green-600';
    case 'warning':
      return '[&>div]:bg-yellow-600';
    case 'critical':
      return '[&>div]:bg-red-600';
  }
}

/**
 * Get pie chart color based on index
 */
function getPieChartColor(index: number): string {
  const colors = [
    '#16a34a', // green-600
    '#2563eb', // blue-600
    '#9333ea', // purple-600
    '#ea580c', // orange-600
    '#dc2626', // red-600
    '#0891b2', // cyan-600
    '#65a30d', // lime-600
    '#c026d3', // fuchsia-600
  ];
  return colors[index % colors.length];
}

/**
 * QuotaProgressVisualization Component
 *
 * Displays quota progress with visual indicators:
 * - Progress bars showing current vs target percentages
 * - Color coding: green (on target), yellow (close), red (off target)
 * - Tooltips with exact numbers
 * - Alternative pie chart visualization
 * - Responsive design
 */
export function QuotaProgressVisualization({
  quotas,
  totalMembers,
  mode = 'bars',
  title = 'Quota Progress',
  description = 'Current distribution vs target quotas',
  compact = false,
  keyLabels,
}: QuotaProgressVisualizationProps) {
  // Memoize labels to prevent unnecessary re-renders
  const labels = React.useMemo(
    () => ({ ...DEFAULT_KEY_LABELS, ...keyLabels }),
    [keyLabels]
  );

  // Calculate overall compliance
  const overallCompliance = React.useMemo(() => {
    if (quotas.length === 0) return { good: 0, warning: 0, critical: 0 };

    return quotas.reduce(
      (acc, quota) => {
        const compliance = getComplianceStatus(quota.currentPercentage, quota.targetPercentage);
        acc[compliance.status] += 1;
        return acc;
      },
      { good: 0, warning: 0, critical: 0 }
    );
  }, [quotas]);

  // Prepare pie chart data
  const pieChartData = React.useMemo(() => {
    return quotas.map((quota) => ({
      name: labels[quota.key] || quota.key,
      value: quota.currentPercentage,
      target: quota.targetPercentage,
    }));
  }, [quotas, labels]);

  // Render progress bars view
  const renderBarsView = () => (
    <div className="space-y-4">
      {quotas.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No quota data available</p>
        </div>
      ) : (
        quotas.map((quota, index) => {
          const compliance = getComplianceStatus(quota.currentPercentage, quota.targetPercentage);
          const progressValue = Math.min((quota.currentPercentage / quota.targetPercentage) * 100, 100);
          const targetCount = totalMembers
            ? Math.round((quota.targetPercentage / 100) * totalMembers)
            : quota.targetCount;

          const isOverTarget = quota.currentPercentage > quota.targetPercentage;
          const isUnderTarget = quota.currentPercentage < quota.targetPercentage;
          const deviation = quota.currentPercentage - quota.targetPercentage;

          return (
            <TooltipProvider key={quota.id}>
              <div
                className={cn(
                  'rounded-lg border p-4 space-y-3 transition-colors',
                  compliance.borderColor,
                  compliance.bgColor
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {labels[quota.key] || quota.key}
                      </h4>
                      <span className={cn('shrink-0', compliance.color)}>
                        {compliance.icon}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {quota.currentCount} of {targetCount} members
                      </span>
                      {(isOverTarget || isUnderTarget) && (
                        <span className={cn('flex items-center gap-1', compliance.color)}>
                          {isOverTarget ? (
                            <>
                              <TrendingUp className="h-3 w-3" />
                              +{Math.abs(deviation).toFixed(1)}%
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-3 w-3" />
                              -{Math.abs(deviation).toFixed(1)}%
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-right shrink-0">
                        <div className={cn('text-lg font-bold', compliance.color)}>
                          {quota.currentPercentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          vs {quota.targetPercentage}%
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <div className="space-y-1">
                        <p className="font-semibold">{labels[quota.key] || quota.key}</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <span>Current:</span>
                          <span className="font-medium">
                            {quota.currentCount} ({quota.currentPercentage.toFixed(1)}%)
                          </span>
                          <span>Target:</span>
                          <span className="font-medium">
                            {targetCount} ({quota.targetPercentage}%)
                          </span>
                          <span>Deviation:</span>
                          <span className={cn('font-medium', compliance.color)}>
                            {deviation >= 0 ? '+' : ''}
                            {deviation.toFixed(1)}%
                          </span>
                          <span>Status:</span>
                          <span className={cn('font-medium', compliance.color)}>
                            {compliance.label}
                          </span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <Progress
                    value={progressValue}
                    className={cn('h-2.5', getProgressBarColor(compliance.status))}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Current: {quota.currentPercentage.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">
                      Target: {quota.targetPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            </TooltipProvider>
          );
        })
      )}

      {/* Overall Summary */}
      {quotas.length > 0 && (
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Quota Compliance</span>
            <div className="flex items-center gap-4">
              {overallCompliance.good > 0 && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {overallCompliance.good} on target
                </span>
              )}
              {overallCompliance.warning > 0 && (
                <span className="flex items-center gap-1 text-yellow-600">
                  <AlertTriangle className="h-4 w-4" />
                  {overallCompliance.warning} close
                </span>
              )}
              {overallCompliance.critical > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {overallCompliance.critical} off target
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render pie chart view
  const renderPieChartView = () => (
    <div className="space-y-4">
      {quotas.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No quota data available</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.name}: ${entry.value.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getPieChartColor(index)} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          {/* Quota details below pie chart */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quotas.map((quota) => {
              const compliance = getComplianceStatus(quota.currentPercentage, quota.targetPercentage);
              const targetCount = totalMembers
                ? Math.round((quota.targetPercentage / 100) * totalMembers)
                : quota.targetCount;

              return (
                <div
                  key={quota.id}
                  className={cn(
                    'rounded-lg border p-3 space-y-1',
                    compliance.borderColor,
                    compliance.bgColor
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {labels[quota.key] || quota.key}
                    </span>
                    <span className={cn('flex items-center gap-1', compliance.color)}>
                      {compliance.icon}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {quota.currentCount} / {targetCount}
                    </span>
                    <span className={cn('font-medium', compliance.color)}>
                      {quota.currentPercentage.toFixed(1)}% / {quota.targetPercentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  const content = mode === 'bars' ? renderBarsView() : renderPieChartView();

  if (compact) {
    return <div className="space-y-4">{content}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
