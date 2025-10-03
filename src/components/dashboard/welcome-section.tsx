import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquarePlus,
  Map,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Role } from '@prisma/client';

interface WelcomeSectionProps {
  user: {
    displayName?: string | null;
    email: string;
    role: Role;
    currentVillageId?: string | null;
  };
}

/**
 * Get time-based greeting message
 */
function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 18) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

/**
 * Get role-specific welcome message
 */
function getRoleMessage(role: Role): string {
  const messages: Record<Role, string> = {
    USER: 'Share your ideas and help shape the product.',
    PM: 'Review feedback and update the product roadmap.',
    PO: 'Prioritize features and manage the product backlog.',
    RESEARCHER: 'Conduct user research and gather insights.',
    ADMIN: 'Manage users, permissions, and platform settings.',
    MODERATOR: 'Review flagged content and maintain community standards.',
  };

  return messages[role] || messages.USER;
}

/**
 * Get formatted date and time in user-friendly format
 */
function getFormattedDateTime(): { date: string; time: string } {
  const now = new Date();

  // Format date: "Friday, October 3, 2025"
  const date = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Format time: "2:30 PM"
  const time = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return { date, time };
}

/**
 * WelcomeSection - Personalized dashboard welcome with user context
 *
 * Displays:
 * - Personalized greeting with user's name and role
 * - Current date/time in user's timezone
 * - Village context (if applicable)
 * - Quick action buttons (Submit Feedback, View Roadmap)
 * - Role-aware messaging
 */
export function WelcomeSection({ user }: WelcomeSectionProps) {
  const greeting = getGreeting();
  const roleMessage = getRoleMessage(user.role);
  const { date, time } = getFormattedDateTime();

  // Determine display name: prefer displayName, fall back to email prefix
  const displayName = user.displayName || user.email.split('@')[0];

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left column: Greeting and role message */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {/* Greeting */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" aria-hidden="true" />
                <h1 id="welcome-heading" className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words">
                  {greeting}, {displayName}!
                </h1>
              </div>
              <p className="text-sm sm:text-base text-gray-700 max-w-2xl" role="status">
                {roleMessage}
              </p>
            </div>

            {/* User context: Role and Village */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 sm:pt-2" role="status" aria-label="User context information">
              <Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1" aria-label={`Your current role is ${user.role}`}>
                {user.role}
              </Badge>
              {user.currentVillageId && (
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                  <Map className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                  <span className="font-medium" aria-label={`Current village: ${user.currentVillageId}`}>
                    {user.currentVillageId}
                  </span>
                </div>
              )}
            </div>

            {/* Quick action buttons - Touch-friendly on mobile */}
            <nav className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4" aria-label="Quick actions">
              <Button asChild size="default" className="shadow-sm min-h-[44px] w-full sm:w-auto">
                <Link href="/feedback/new" aria-label="Submit new feedback">
                  <MessageSquarePlus className="h-4 w-4 mr-2" aria-hidden="true" />
                  Submit Feedback
                </Link>
              </Button>
              <Button asChild variant="outline" size="default" className="shadow-sm min-h-[44px] w-full sm:w-auto">
                <Link href="/roadmap" aria-label="View product roadmap">
                  <Map className="h-4 w-4 mr-2" aria-hidden="true" />
                  View Roadmap
                </Link>
              </Button>
            </nav>
          </div>

          {/* Right column: Date and time - Better mobile layout */}
          <div className="flex flex-col justify-center items-start lg:items-end space-y-1 pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l lg:pl-6 border-blue-200" role="status" aria-label="Current date and time">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs sm:text-sm font-medium">Today</span>
            </div>
            <time className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 break-words" dateTime={new Date().toISOString()}>
              {date}
            </time>
            <time className="text-xl sm:text-2xl font-bold text-blue-600" dateTime={new Date().toISOString()}>
              {time}
            </time>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
