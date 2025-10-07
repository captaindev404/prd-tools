import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

/**
 * StatsCard - Display a single metric with optional icon and trend
 *
 * Features:
 * - Large value display with optional icon
 * - Optional trend indicator (up/down/neutral) with percentage
 * - Color variants for different metric types
 * - Description text for context
 *
 * Usage:
 * <StatsCard
 *   title="Total Feedback"
 *   value={1234}
 *   description="Last 30 days"
 *   icon={MessageSquare}
 *   trend={{ value: 12.5, label: "vs last month" }}
 * />
 */
export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = 'default',
}: StatsCardProps) {
  // Determine trend direction and icon
  const getTrendInfo = (trendValue: number) => {
    if (trendValue > 0) {
      return {
        icon: TrendingUp,
        color: 'text-green-600',
        prefix: '+',
      };
    } else if (trendValue < 0) {
      return {
        icon: TrendingDown,
        color: 'text-red-600',
        prefix: '',
      };
    } else {
      return {
        icon: Minus,
        color: 'text-gray-500',
        prefix: '',
      };
    }
  };

  const trendInfo = trend ? getTrendInfo(trend.value) : null;
  const TrendIcon = trendInfo?.icon;

  // Create accessible description for screen readers
  const ariaLabel = trend
    ? `${title}: ${value}. ${description || ''}. Trend: ${trendInfo?.prefix}${Math.abs(trend.value)}% ${trend.label || ''}`
    : `${title}: ${value}. ${description || ''}`;

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        variant === 'primary' && 'border-primary/50 bg-primary/5',
        variant === 'success' && 'border-green-500/50 bg-green-50/50',
        variant === 'warning' && 'border-amber-500/50 bg-amber-50/50'
      )}
      role="article"
      aria-label={ariaLabel}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground" id={`stats-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {title}
        </CardTitle>
        {Icon && (
          <Icon
            className={cn(
              'h-4 w-4 flex-shrink-0',
              variant === 'default' && 'text-muted-foreground',
              variant === 'primary' && 'text-primary',
              variant === 'success' && 'text-green-600',
              variant === 'warning' && 'text-amber-600'
            )}
            aria-hidden="true"
          />
        )}
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="space-y-1">
          <div
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            aria-live="polite"
            aria-atomic="true"
          >
            {value}
          </div>
          {(description || trend) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              {description && <span>{description}</span>}
              {trend && TrendIcon && (
                <div className={cn('flex items-center gap-1', trendInfo?.color)} aria-live="polite">
                  <TrendIcon className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                  <span className="font-medium">
                    {trendInfo?.prefix}{Math.abs(trend.value)}%
                  </span>
                  {trend.label && <span className="text-muted-foreground">{trend.label}</span>}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
