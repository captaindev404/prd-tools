import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building, MessageSquare, ThumbsUp } from 'lucide-react';
import type { AdminDashboardStats } from '@/types/admin';

interface StatsCardsProps {
  stats: AdminDashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            {stats.activeUsersLast30Days} active in last 30 days
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Villages</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalVillages}</div>
          <p className="text-xs text-muted-foreground">
            Club Med locations
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Feedback</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.feedbackStats.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.feedbackStats.today} today, {stats.feedbackStats.thisWeek} this week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Votes</CardTitle>
          <ThumbsUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.votesStats.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.votesStats.today} today, {stats.votesStats.thisWeek} this week
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
