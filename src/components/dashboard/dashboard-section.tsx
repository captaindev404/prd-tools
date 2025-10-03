import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}

/**
 * DashboardSection - Reusable section wrapper for dashboard content
 *
 * Provides consistent spacing, optional header with title/description,
 * and flexible content area. Can be used for any dashboard section.
 */
export function DashboardSection({
  title,
  description,
  children,
  className,
  headerAction,
}: DashboardSectionProps) {
  return (
    <section className={cn('space-y-3 sm:space-y-4', className)}>
      {(title || description || headerAction) && (
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            {title && (
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight break-words">{title}</h2>
            )}
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{description}</p>
            )}
          </div>
          {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
