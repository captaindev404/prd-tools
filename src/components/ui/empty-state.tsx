import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * EmptyState Component
 *
 * A reusable component for displaying empty states across the application.
 * Provides a consistent, encouraging experience when no data is available.
 *
 * Features:
 * - Customizable icon, title, and description
 * - Optional call-to-action button(s)
 * - Muted styling with centered layout
 * - Maintains card structure for layout consistency
 * - Responsive sizing
 * - Accessibility-first design
 *
 * Design Patterns:
 * - Icon at top (h-12 w-12, muted color)
 * - Heading (text-lg, font-semibold)
 * - Description (text-sm, muted-foreground)
 * - CTA button(s) below with appropriate variants
 *
 * Usage:
 * ```tsx
 * <EmptyState
 *   icon={MessageSquare}
 *   title="No feedback yet"
 *   description="Be the first to share your ideas and help shape our products."
 *   action={{
 *     label: "Submit Feedback",
 *     href: "/feedback/new",
 *   }}
 * />
 * ```
 *
 * Multiple actions example:
 * ```tsx
 * <EmptyState
 *   icon={TrendingUp}
 *   title="No trending ideas"
 *   description="Check back soon to see popular feedback."
 *   actions={[
 *     { label: "Submit Feedback", href: "/feedback/new", variant: "default" },
 *     { label: "Browse All", href: "/feedback", variant: "outline" },
 *   ]}
 * />
 * ```
 */

export interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  icon?: LucideIcon;
}

export interface EmptyStateProps {
  /** Icon to display (lucide-react icon component) */
  icon: LucideIcon;
  /** Primary title text */
  title: string;
  /** Descriptive text explaining the empty state */
  description: string;
  /** Single action button (use actions for multiple buttons) */
  action?: EmptyStateAction;
  /** Multiple action buttons */
  actions?: EmptyStateAction[];
  /** Additional CSS classes for the container */
  className?: string;
  /** Size variant for the component */
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actions,
  className,
  size = 'md',
}: EmptyStateProps) {
  // Normalize actions into array
  const actionButtons = actions || (action ? [action] : []);

  // Size-based styling
  const sizeClasses = {
    sm: {
      container: 'py-6 sm:py-8',
      icon: 'h-10 w-10 sm:h-12 sm:w-12',
      title: 'text-base sm:text-lg',
      description: 'text-xs sm:text-sm',
      spacing: 'space-y-2 sm:space-y-3',
    },
    md: {
      container: 'py-8 sm:py-12',
      icon: 'h-12 w-12',
      title: 'text-lg sm:text-xl',
      description: 'text-sm',
      spacing: 'space-y-3 sm:space-y-4',
    },
    lg: {
      container: 'py-12 sm:py-16',
      icon: 'h-14 w-14 sm:h-16 sm:w-16',
      title: 'text-xl sm:text-2xl',
      description: 'text-sm sm:text-base',
      spacing: 'space-y-4 sm:space-y-5',
    },
  };

  const styles = sizeClasses[size];

  return (
    <div
      className={cn('text-center', styles.container, className)}
      role="status"
      aria-live="polite"
    >
      <div className={cn('flex flex-col items-center', styles.spacing)}>
        {/* Icon */}
        <div
          className="flex items-center justify-center"
          aria-hidden="true"
        >
          <Icon
            className={cn(
              styles.icon,
              'text-muted-foreground/50'
            )}
          />
        </div>

        {/* Content */}
        <div className="space-y-2 max-w-md mx-auto px-4">
          <h3
            className={cn(
              'font-semibold text-muted-foreground',
              styles.title
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              'text-muted-foreground/80 leading-relaxed',
              styles.description
            )}
          >
            {description}
          </p>
        </div>

        {/* Actions */}
        {actionButtons.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 pt-2 w-full sm:w-auto px-4">
            {actionButtons.map((actionItem, index) => {
              const ActionIcon = actionItem.icon;

              // If onClick is provided, use button without Link
              if (actionItem.onClick) {
                return (
                  <Button
                    key={index}
                    variant={actionItem.variant || 'default'}
                    size="default"
                    onClick={actionItem.onClick}
                    className="w-full sm:w-auto min-h-[44px] sm:min-h-[40px] inline-flex items-center gap-2"
                  >
                    {ActionIcon && <ActionIcon className="h-4 w-4" />}
                    {actionItem.label}
                  </Button>
                );
              }

              // Otherwise use Link with href
              return (
                <Button
                  key={index}
                  asChild
                  variant={actionItem.variant || 'default'}
                  size="default"
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-[40px]"
                >
                  <Link
                    href={actionItem.href || '#'}
                    className="inline-flex items-center gap-2"
                  >
                    {ActionIcon && <ActionIcon className="h-4 w-4" />}
                    {actionItem.label}
                  </Link>
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
