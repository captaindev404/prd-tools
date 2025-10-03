import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, MapPin, Calendar, Mail, Briefcase } from 'lucide-react';
import { getCurrentUser, isAdmin } from '@/lib/auth-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RoleBadge } from '@/components/admin/role-badge';
import { format } from 'date-fns';

interface UserDetailPageProps {
  params: {
    userId: string;
  };
}

async function getUserDetails(userId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/users/${userId}`,
    {
      cache: 'no-store',
      headers: {
        Cookie: '', // Will be handled by Next.js
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function getUserActivity(userId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/users/${userId}/activity`,
    {
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const user = await getCurrentUser();

  if (!user || !isAdmin(user)) {
    redirect('/unauthorized');
  }

  const [targetUser, activity] = await Promise.all([
    getUserDetails(params.userId),
    getUserActivity(params.userId),
  ]);

  if (!targetUser) {
    redirect('/admin/users');
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      const parts = name.split(' ');
      return parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const consents = JSON.parse(targetUser.consents || '[]');

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">User Details</h1>
          <p className="text-muted-foreground">View and manage user information</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={targetUser.avatarUrl || undefined} />
                <AvatarFallback className="text-lg">
                  {getInitials(targetUser.displayName, targetUser.email)}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">
                {targetUser.displayName || targetUser.email.split('@')[0]}
              </CardTitle>
              <CardDescription className="mt-1">{targetUser.email}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Role:</span>
                <RoleBadge role={targetUser.role} />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Employee ID:</span>
                <span>{targetUser.employeeId}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Village:</span>
                <span>{targetUser.currentVillage?.name || 'No village'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Joined:</span>
                <span>{format(new Date(targetUser.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Activity Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Feedback</p>
                  <p className="text-lg font-semibold">{targetUser._count.feedbacks}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Votes</p>
                  <p className="text-lg font-semibold">{targetUser._count.votes}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Responses</p>
                  <p className="text-lg font-semibold">
                    {targetUser._count.questionnaireResponses}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Panels</p>
                  <p className="text-lg font-semibold">{targetUser._count.panelMemberships}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <Tabs defaultValue="activity" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="consents">Consents</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="activity" className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Recent Feedback</h3>
                  {activity?.feedback?.length > 0 ? (
                    <div className="space-y-2">
                      {activity.feedback.slice(0, 5).map((fb: any) => (
                        <div key={fb.id} className="flex items-center justify-between p-2 rounded-md border">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{fb.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(fb.createdAt), 'MMM d, yyyy')} • {fb.voteCount} votes
                            </p>
                          </div>
                          <Badge variant="outline">{fb.state}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No feedback submitted</p>
                  )}
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold mb-3">Panel Memberships</h3>
                  {activity?.panelMemberships?.length > 0 ? (
                    <div className="space-y-2">
                      {activity.panelMemberships.map((pm: any) => (
                        <div key={pm.id} className="flex items-center justify-between p-2 rounded-md border">
                          <div>
                            <p className="text-sm font-medium">{pm.panelName}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined {format(new Date(pm.joinedAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <Badge variant={pm.active ? 'default' : 'secondary'}>
                            {pm.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No panel memberships</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="consents" className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Current Consents</h3>
                  <div className="space-y-2">
                    {['research_contact', 'usage_analytics', 'email_updates'].map((consent) => (
                      <div key={consent} className="flex items-center justify-between p-2 rounded-md border">
                        <span className="text-sm capitalize">{consent.replace('_', ' ')}</span>
                        <Badge variant={consents.includes(consent) ? 'default' : 'secondary'}>
                          {consents.includes(consent) ? 'Granted' : 'Not granted'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold mb-3">Consent History</h3>
                  {targetUser.consentHistory?.length > 0 ? (
                    <div className="space-y-2">
                      {targetUser.consentHistory.slice(0, 10).map((ch: any, index: number) => (
                        <div key={index} className="text-sm p-2 rounded-md border">
                          <p className="font-medium capitalize">{ch.consent_type.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">
                            {ch.granted ? 'Granted' : 'Revoked'} on{' '}
                            {format(new Date(ch.timestamp), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No consent history</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Village History</h3>
                  {targetUser.villageHistory?.length > 0 ? (
                    <div className="space-y-2">
                      {targetUser.villageHistory.map((vh: any, index: number) => (
                        <div key={index} className="p-2 rounded-md border">
                          <p className="text-sm font-medium">{vh.villageName}</p>
                          <p className="text-xs text-muted-foreground">
                            From {format(new Date(vh.from), 'MMM d, yyyy')}
                            {vh.to && ` to ${format(new Date(vh.to), 'MMM d, yyyy')}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No village history</p>
                  )}
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
