'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Users, Settings, Archive, Edit, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { InviteMembersDialog } from '@/components/panels/invite-members-dialog';

interface PanelDetailPageProps {
  params: { id: string };
}

export default function PanelDetailPage({ params }: PanelDetailPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [panel, setPanel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  useEffect(() => {
    fetchPanel();
  }, [params.id]);

  const fetchPanel = async () => {
    try {
      const response = await fetch(`/api/panels/${params.id}`);
      const data = await response.json();
      setPanel(data);
    } catch (error) {
      console.error('Failed to fetch panel:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this panel?')) return;

    try {
      await fetch(`/api/panels/${params.id}`, { method: 'DELETE' });
      toast({ title: 'Panel archived' });
      router.push('/research/panels');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to archive panel', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="container py-10">
        <Skeleton className="h-10 w-1/2 mb-4" />
        <Skeleton className="h-6 w-1/3 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!panel) {
    return <div className="container py-10">Panel not found</div>;
  }

  return (
    <div className="container py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">{panel.name}</h1>
            {panel.archived && <Badge variant="secondary">Archived</Badge>}
          </div>
          {panel.description && (
            <p className="text-muted-foreground">{panel.description}</p>
          )}
          {panel.createdBy && (
            <p className="text-sm text-muted-foreground mt-2">
              Created by {panel.createdBy.displayName}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Members
          </Button>
          <Link href={`/research/panels/${params.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          {!panel.archived && (
            <Button variant="outline" onClick={handleArchive}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{panel.memberCount || 0}</div>
            {panel.sizeTarget && (
              <p className="text-xs text-muted-foreground">
                Target: {panel.sizeTarget} ({Math.round((panel.memberCount / panel.sizeTarget) * 100)}%)
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Panel Members</CardTitle>
              <CardDescription>Users who are part of this research panel</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Member list component to be implemented</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Panel Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Eligibility Rules</p>
                <pre className="mt-2 text-xs bg-muted p-4 rounded overflow-auto">
                  {JSON.stringify(JSON.parse(panel.eligibilityRules || '{}'), null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <InviteMembersDialog
        panelId={params.id}
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={fetchPanel}
      />
    </div>
  );
}
