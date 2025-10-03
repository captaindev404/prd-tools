import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PanelCard } from '@/components/panels/panel-card';
import { getCurrentUser, canCreatePanel } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Plus } from 'lucide-react';

export const metadata = {
  title: 'Research Panels | Odyssey Feedback',
  description: 'Manage research panels for user testing and feedback collection',
};

export default async function PanelsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/api/auth/signin');
  }

  const canManage = canCreatePanel(user);

  // Build where clause based on user permissions
  const where: any = {
    archived: false,
  };

  if (!canManage) {
    // Regular users only see panels they're members of
    const memberships = await prisma.panelMembership.findMany({
      where: { userId: user.id },
      select: { panelId: true },
    });

    const panelIds = memberships.map((m) => m.panelId);

    if (panelIds.length === 0) {
      // No panels for this user
      return (
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">My Research Panels</h1>
              <p className="text-muted-foreground mt-2">
                View panels you are invited to or a member of
              </p>
            </div>
          </div>

          <div className="text-center py-12">
            <p className="text-muted-foreground">
              You are not a member of any research panels yet.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              You will receive a notification when you are invited to a panel.
            </p>
          </div>
        </div>
      );
    }

    where.id = { in: panelIds };
  }

  // Fetch panels
  const panels = await prisma.panel.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          memberships: true,
        },
      },
    },
  });

  // Panel doesn't have createdById, so creator is null
  const panelsWithDetails = panels.map((panel) => ({
    ...panel,
    memberCount: panel._count.memberships,
    creator: null,
  }));

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {canManage ? 'Research Panels' : 'My Research Panels'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {canManage
              ? 'Manage research panels for user testing and feedback collection'
              : 'View panels you are invited to or a member of'}
          </p>
        </div>
        {canManage && (
          <Link href="/research/panels/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Panel
            </Button>
          </Link>
        )}
      </div>

      {panelsWithDetails.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">
            {canManage
              ? 'No research panels created yet. Create your first panel to get started.'
              : 'You are not a member of any research panels yet.'}
          </p>
          {canManage && (
            <Link href="/research/panels/new">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Panel
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {panelsWithDetails.map((panel) => (
            <PanelCard key={panel.id} panel={panel} />
          ))}
        </div>
      )}
    </div>
  );
}
