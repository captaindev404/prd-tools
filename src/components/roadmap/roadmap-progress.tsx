import { cn } from '@/lib/utils';

interface RoadmapProgressProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
}

export function RoadmapProgress({
  progress,
  className,
  showLabel = true,
}: RoadmapProgressProps) {
  // Ensure progress is between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, progress));

  // Determine color based on progress
  const getProgressColor = (value: number) => {
    if (value === 0) return 'bg-gray-200';
    if (value < 30) return 'bg-red-500';
    if (value < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-300',
            getProgressColor(clampedProgress)
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-gray-600 min-w-[3rem] text-right">
          {clampedProgress}%
        </span>
      )}
    </div>
  );
}
