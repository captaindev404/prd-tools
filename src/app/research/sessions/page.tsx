import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAnyRole } from '@/lib/session';
import { Role } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { SessionsListView } from './sessions-list-view';
import { SessionsCalendarView } from './sessions-calendar-view';

export default async function SessionsPage() {
  const session = await requireAnyRole([Role.RESEARCHER, Role.PM, Role.ADMIN, Role.USER]);

  const canCreate = ['RESEARCHER', 'PM', 'ADMIN'].includes(session.user.role);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Research Sessions</h1>
          <p className="text-muted-foreground mt-1">
            {canCreate
              ? 'Manage and schedule research sessions'
              : 'View your upcoming research sessions'}
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/research/sessions/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Session
            </Link>
          </Button>
        )}
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Suspense fallback={<SessionsListSkeleton />}>
            <SessionsListView userId={session.user.id} canSeeAll={canCreate} />
          </Suspense>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Suspense fallback={<div>Loading calendar...</div>}>
            <SessionsCalendarView userId={session.user.id} canSeeAll={canCreate} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SessionsListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-40 w-full" />
      ))}
    </div>
  );
}
