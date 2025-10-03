import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RoadmapStage } from '@prisma/client';

interface RoadmapStageBadgeProps {
  stage: RoadmapStage;
  className?: string;
}

const stageConfig: Record<
  RoadmapStage,
  { label: string; variant: string; className: string }
> = {
  now: {
    label: 'Now',
    variant: 'default',
    className: 'bg-green-500 text-white hover:bg-green-600',
  },
  next: {
    label: 'Next',
    variant: 'default',
    className: 'bg-blue-500 text-white hover:bg-blue-600',
  },
  later: {
    label: 'Later',
    variant: 'secondary',
    className: 'bg-gray-400 text-white hover:bg-gray-500',
  },
  under_consideration: {
    label: 'Under Consideration',
    variant: 'default',
    className: 'bg-yellow-500 text-white hover:bg-yellow-600',
  },
};

export function RoadmapStageBadge({ stage, className }: RoadmapStageBadgeProps) {
  const config = stageConfig[stage];

  return (
    <Badge
      className={cn(
        'border-transparent shadow',
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
