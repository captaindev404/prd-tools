import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

/**
 * DashboardGrid - Responsive grid layout for dashboard content
 *
 * Provides responsive grid with configurable columns that adapts to screen size:
 * - Mobile: Always single column (stacked)
 * - Tablet (md): 2 columns by default, or 1 if columns=1
 * - Desktop (lg+): Full column count specified
 *
 * Usage:
 * <DashboardGrid columns={3}>
 *   <Card>...</Card>
 *   <Card>...</Card>
 * </DashboardGrid>
 */
export function DashboardGrid({
  children,
  columns = 3,
  className,
}: DashboardGridProps) {
  const gridClasses = cn(
    'grid gap-3 sm:gap-4 lg:gap-6',
    // Mobile: always single column
    'grid-cols-1',
    // Tablet: 2 columns for 3-4 column grids, single for 1 column
    columns === 1 && 'md:grid-cols-1',
    columns === 2 && 'md:grid-cols-2',
    columns >= 3 && 'md:grid-cols-2',
    // Desktop: full column count
    columns === 2 && 'lg:grid-cols-2',
    columns === 3 && 'lg:grid-cols-3',
    columns === 4 && 'lg:grid-cols-4',
    className
  );

  return <div className={gridClasses}>{children}</div>;
}
