import { Badge } from '@/components/ui/badge';
import type { FeatureStatus } from '@prisma/client';

interface FeatureStatusBadgeProps {
  status: FeatureStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  FeatureStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'outline' | 'destructive';
    className?: string;
  }
> = {
  idea: {
    label: 'Idea',
    variant: 'outline',
    className: 'bg-gray-50 text-gray-700 border-gray-300',
  },
  discovery: {
    label: 'Discovery',
    variant: 'outline',
    className: 'bg-blue-50 text-blue-700 border-blue-300',
  },
  shaping: {
    label: 'Shaping',
    variant: 'outline',
    className: 'bg-purple-50 text-purple-700 border-purple-300',
  },
  in_progress: {
    label: 'In Progress',
    variant: 'default',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  released: {
    label: 'Released',
    variant: 'default',
    className: 'bg-green-100 text-green-800 border-green-300',
  },
  generally_available: {
    label: 'GA',
    variant: 'default',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  deprecated: {
    label: 'Deprecated',
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-600 border-gray-300',
  },
};

export function FeatureStatusBadge({ status, className }: FeatureStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant={config.variant} className={`${config.className} ${className || ''}`}>
      {config.label}
    </Badge>
  );
}
