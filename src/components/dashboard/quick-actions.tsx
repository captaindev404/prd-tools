import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  MessageSquarePlus,
  ListChecks,
  Layers,
  FlaskConical,
  ArrowRight,
} from 'lucide-react';

interface QuickActionsProps {
  userRole: string;
  userConsents?: string; // JSON string array from database
}

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  variant?: 'default' | 'secondary' | 'outline';
  show: boolean;
}

/**
 * Quick Actions Component
 *
 * Accessibility Features:
 * - Proper heading hierarchy (h2 for section title)
 * - Navigation landmark for action buttons
 * - ARIA labels for all action buttons
 * - Decorative icons marked with aria-hidden
 * - Keyboard navigable links with clear focus states
 * - Touch-friendly minimum tap target sizes (44px)
 */

export function QuickActions({ userRole, userConsents = '[]' }: QuickActionsProps) {
  // Parse consents JSON string to array
  const consentsArray: string[] = (() => {
    try {
      return JSON.parse(userConsents || '[]');
    } catch {
      return [];
    }
  })();

  // Check if user has research consent
  const hasResearchConsent = consentsArray.includes('research_contact');

  // Check if user has researcher role
  const isResearcher = ['RESEARCHER', 'ADMIN', 'PO'].includes(userRole);

  // Show research panel if user is a researcher OR has research consent
  const canAccessResearch = isResearcher || hasResearchConsent;

  const quickActions: QuickAction[] = [
    {
      title: 'Submit Feedback',
      description: 'Share your ideas and suggestions',
      href: '/feedback/new',
      icon: MessageSquarePlus,
      variant: 'default',
      show: true,
    },
    {
      title: 'View My Feedback',
      description: 'Track your submitted feedback',
      href: '/feedback?filter=my-feedback',
      icon: ListChecks,
      variant: 'outline',
      show: true,
    },
    {
      title: 'Browse Features',
      description: 'Explore the product catalog',
      href: '/features',
      icon: Layers,
      variant: 'outline',
      show: true,
    },
    {
      title: 'Join Research Panel',
      description: 'Participate in user research',
      href: '/research/panels',
      icon: FlaskConical,
      variant: 'secondary',
      show: canAccessResearch,
    },
  ];

  // Filter actions based on show condition
  const visibleActions = quickActions.filter(action => action.show);

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle id="quick-actions-heading" className="text-lg sm:text-xl">Quick Actions</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        {/* Mobile: Single column, Tablet: 2 cols, Desktop: 4 cols - Touch-optimized spacing */}
        <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-label="Quick action shortcuts">
          {visibleActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.href}
                asChild
                variant={action.variant || 'outline'}
                className="h-auto min-h-[80px] sm:min-h-[88px] flex-col items-start p-4 gap-2 group active:scale-95 transition-transform"
              >
                <Link href={action.href} aria-label={`${action.title}: ${action.description}`}>
                  <div className="flex items-center gap-2 w-full">
                    <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    <span className="font-semibold text-sm flex-1 text-left break-words">
                      {action.title}
                    </span>
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-left w-full opacity-80 font-normal mt-1 leading-relaxed">
                    {action.description}
                  </p>
                </Link>
              </Button>
            );
          })}
        </nav>

        {!canAccessResearch && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Want to participate in research?{' '}
              <Link
                href="/settings"
                className="underline hover:text-foreground min-h-[44px] inline-flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded"
                aria-label="Update consent preferences for research participation"
              >
                Update your consent preferences
              </Link>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}