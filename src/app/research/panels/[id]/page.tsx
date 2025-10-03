import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { EligibilityDisplay } from '@/components/panels/eligibility-display';
import { PanelMemberList } from '@/components/panels/panel-member-list';
import { getCurrentUser, canManagePanelMembers } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Pencil, Users } from 'lucide-react';

export const metadata = {
  title: 'Panel Details | Odyssey Feedback',
};

interface PanelDetailPageProps {
  params: { id: string };
}

export default async function PanelDetailPage({ params }: PanelDetailPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/api/auth/signin');
  }

  const panelId = params.id;

  // Fetch panel with memberships
  const panel = await prisma.panel.findUnique({
    where: { id: panelId },
    include: {
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              email: true,
              role: true,
              currentVillageId: true,
              currentVillage: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      },
      _count: {
        select: {
          memberships: true,
        },
      },
    },
  });

  if (!panel) {
    notFound();
  }

  // Check access permissions
  const canManage = canManagePanelMembers(user);
  const isMember = panel.memberships.some((m) => m.userId === user.id);

  if (!canManage && !isMember) {
    redirect('/research/panels');
  }

  // Panel doesn't have createdById, so creator is null
  const creator = null;

  // PanelMembership doesn't have invitedById, so inviter is null
  const membershipsWithInviter = panel.memberships.map((membership) => ({
    ...membership,
    invitedBy: null,
  }));

  // Parse eligibility rules
  let eligibilityRules: any = {};
  try {
    eligibilityRules = JSON.parse(panel.eligibilityRules);
  } catch {
    eligibilityRules = {};
  }

  const canEdit = ['ADMIN', 'PM', 'PO', 'RESEARCHER'].includes(user.role);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">{panel.name}</h1>
        </div>
        {canEdit && (
          <Link href={`/research/panels/${panel.id}/edit`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              Edit Panel
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{panel._count.memberships}</span>
              {panel.sizeTarget && (
                <span className="text-sm text-muted-foreground">/ {panel.sizeTarget}</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {panel.memberships.filter((m) => m.active).length}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {panel.memberships.filter((m) => !m.active).length}
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <EligibilityDisplay criteria={eligibilityRules} />

        <Separator />

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Panel Members</h2>
            {canManage && (
              <div className="flex gap-2">
                {/* TODO: Add InviteMembersDialog component */}
                <Button disabled>Invite Members (Coming Soon)</Button>
              </div>
            )}
          </div>

          <PanelMemberList
            members={membershipsWithInviter}
            canManage={canManage}
          />
        </div>
      </div>
    </div>
  );
}
