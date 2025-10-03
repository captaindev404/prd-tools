import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, Building, Settings, Activity } from 'lucide-react';
import { getCurrentUser, isAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCards } from '@/components/admin/stats-cards';
import { ActivityFeed } from '@/components/admin/activity-feed';
import type { AdminDashboardStats, ActivityEvent } from '@/types/admin';

async function getAdminStats(): Promise<AdminDashboardStats> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const today = new Date(now.setHours(0, 0, 0, 0));
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get user stats
  const totalUsers = await prisma.user.count();
  const usersByRole = await prisma.user.groupBy({
    by: ['role'],
    _count: true,
  });

  const roleCount = usersByRole.reduce(
    (acc, { role, _count }) => {
      acc[role] = _count;
      return acc;
    },
    { USER: 0, PM: 0, PO: 0, RESEARCHER: 0, ADMIN: 0, MODERATOR: 0 } as Record<string, number>
  );

  // Get active users (with sessions in last 30 days)
  // Count active users by grouping distinct userIds
  const activeSessions = await prisma.authSession.findMany({
    where: {
      expires: {
        gte: thirtyDaysAgo,
      },
    },
    select: {
      userId: true,
    },
    distinct: ['userId'],
  });
  const activeUsersLast30Days = activeSessions.length;

  // Get village count
  const totalVillages = await prisma.village.count();

  // Get feedback stats
  const totalFeedback = await prisma.feedback.count();
  const feedbackToday = await prisma.feedback.count({
    where: { createdAt: { gte: today } },
  });
  const feedbackThisWeek = await prisma.feedback.count({
    where: { createdAt: { gte: weekAgo } },
  });

  // Get vote stats
  const totalVotes = await prisma.vote.count();
  const votesToday = await prisma.vote.count({
    where: { createdAt: { gte: today } },
  });
  const votesThisWeek = await prisma.vote.count({
    where: { createdAt: { gte: weekAgo } },
  });

  return {
    totalUsers,
    usersByRole: roleCount as any,
    activeUsersLast30Days,
    totalVillages,
    feedbackStats: {
      total: totalFeedback,
      today: feedbackToday,
      thisWeek: feedbackThisWeek,
    },
    votesStats: {
      total: totalVotes,
      today: votesToday,
      thisWeek: votesThisWeek,
    },
  };
}

async function getRecentActivity(): Promise<ActivityEvent[]> {
  const recentEvents = await prisma.event.findMany({
    where: {
      type: {
        in: [
          'admin.user.role_changed',
          'admin.user.village_changed',
          'admin.village.created',
          'feedback.created',
          'vote.cast',
        ],
      },
    },
    include: {
      user: {
        select: {
          displayName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  return recentEvents.map((event) => {
    let description = event.type;
    try {
      const payload = JSON.parse(event.payload);
      switch (event.type) {
        case 'admin.user.role_changed':
          description = `Changed ${payload.targetUserEmail}'s role from ${payload.oldRole} to ${payload.newRole}`;
          break;
        case 'admin.user.village_changed':
          description = `Changed ${payload.targetUserEmail}'s village`;
          break;
        case 'admin.village.created':
          description = `Created village: ${payload.villageName}`;
          break;
        case 'feedback.created':
          description = `New feedback submitted`;
          break;
        case 'vote.cast':
          description = `Vote cast on feedback`;
          break;
      }
    } catch (e) {
      // Keep default description
    }

    return {
      id: event.id,
      type: event.type,
      description,
      timestamp: event.createdAt,
      userId: event.userId || undefined,
      userName: event.user?.displayName || event.user?.email || undefined,
    };
  });
}

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user || !isAdmin(user)) {
    redirect('/unauthorized');
  }

  const [stats, recentActivity] = await Promise.all([getAdminStats(), getRecentActivity()]);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users, villages, and monitor system activity
        </p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage user accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Village Management</CardTitle>
            <CardDescription>Manage Club Med villages</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/villages">
                <Building className="mr-2 h-4 w-4" />
                Manage Villages
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>Configure system-wide settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href="/admin/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <ActivityFeed events={recentActivity} />
    </div>
  );
}
