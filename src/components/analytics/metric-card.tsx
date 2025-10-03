/**
 * MetricCard Component
 *
 * Displays a single metric with value, label, and optional trend indicator
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  description?: string;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function MetricCard({
  label,
  value,
  trend,
  trendLabel,
  icon,
  description,
  color = 'default',
  className,
}: MetricCardProps) {
  // Determine trend direction
  const getTrendIcon = () => {
    if (trend === undefined || trend === null) return null;

    if (Math.abs(trend) < 1) {
      return <Minus className="h-4 w-4 text-gray-500" />;
    }

    return trend > 0 ? (
      <ArrowUp className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowDown className="h-4 w-4 text-red-600" />
    );
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === null) return 'text-gray-500';
    if (Math.abs(trend) < 1) return 'text-gray-500';
    return trend > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getCardColor = () => {
    switch (color) {
      case 'primary':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-amber-200 bg-amber-50';
      case 'danger':
        return 'border-red-200 bg-red-50';
      default:
        return '';
    }
  };

  return (
    <Card className={cn(getCardColor(), className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {label}
        </CardTitle>
        {icon && <div className="text-gray-400">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold">{value}</div>
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
          {trend !== undefined && trend !== null && (
            <div className="flex items-center gap-1 text-xs">
              {getTrendIcon()}
              <span className={cn('font-medium', getTrendColor())}>
                {Math.abs(trend).toFixed(1)}%
              </span>
              {trendLabel && (
                <span className="text-gray-500">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
