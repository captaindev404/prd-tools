'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Users, Settings, Archive, Edit, UserPlus, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { InviteMembersDialog } from '@/components/panels/invite-members-dialog';
import { PanelMemberList } from '@/components/panels/panel-member-list';
import { handleApiError } from '@/lib/api-error-handler';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePanelPermissions } from '@/hooks/use-panel-permissions';

interface PanelDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PanelDetailPage({ params }: PanelDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [panel, setPanel] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [error, setError] = useState<{ message: string; isRetryable: boolean } | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Permission checks using the hook
  const { canEdit, canDelete, canInviteMembers, getTooltipMessage } = usePanelPermissions(panel);

  useEffect(() => {
    fetchPanel();
    fetchMembers();
  }, [id]);

  const fetchPanel = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/panels/${id}`);

      if (!response.ok) {
        throw response;
      }

      const data = await response.json();
      setPanel(data);
    } catch (err) {
      const errorResult = await handleApiError(err, {
        context: 'Fetching panel details',
      });

      setError({
        message: errorResult.message,
        isRetryable: errorResult.isRetryable,
      });

      toast({
        title: 'Error loading panel',
        description: errorResult.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    setLoadingMembers(true);

    try {
      const response = await fetch(`/api/panels/${id}/members`);

      if (!response.ok) {
        throw response;
      }

      const data = await response.json();
      setMembers(data.members || []);
    } catch (err) {
      const errorResult = await handleApiError(err, {
        context: 'Fetching panel members',
      });

      // Don't set error state for members, just show empty state
      console.error('Error fetching members:', errorResult.message);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this panel?')) return;

    try {
      const response = await fetch(`/api/panels/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        throw response;
      }

      toast({ title: 'Panel archived' });
      router.push('/research/panels');
    } catch (err) {
      const errorResult = await handleApiError(err, {
        context: 'Archiving panel',
      });

      toast({
        title: 'Error archiving panel',
        description: errorResult.message,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const response = await fetch(`/api/panels/${id}/members/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw response;
      }

      toast({ title: 'Member removed successfully' });
      fetchMembers(); // Refresh the member list
    } catch (err) {
      const errorResult = await handleApiError(err, {
        context: 'Removing member',
      });

      toast({
        title: 'Error removing member',
        description: errorResult.message,
        variant: 'destructive',
      });
    }
  };

  const handleInviteSuccess = () => {
    fetchPanel(); // Refresh panel to update member count
    fetchMembers(); // Refresh member list
  };

  if (loading) {
    return (
      <div className="container py-10" role="status" aria-label="Loading panel details">
        {/* Header skeleton */}
        <div className="mb-8 flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="h-10 w-2/3 mb-2" />
            <Skeleton className="h-5 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[140px]" />
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-10 w-[100px]" />
          </div>
        </div>

        {/* Stats cards skeleton */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
        </div>

        {/* Tabs skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-[300px] w-full" />
        </div>
        <span className="sr-only">Loading panel information...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Panel</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error.message}</span>
            {error.isRetryable && (
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPanel}
                className="ml-4"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!panel) {
    return (
      <div className="container py-10">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Panel Not Found</AlertTitle>
          <AlertDescription>
            The panel you're looking for doesn't exist or has been deleted.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <TooltipProvider>
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
            {/* Invite Members Button with permission check and tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    onClick={() => setInviteDialogOpen(true)}
                    disabled={!canInviteMembers}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Members
                  </Button>
                </span>
              </TooltipTrigger>
              {!canInviteMembers && (
                <TooltipContent>
                  <p>{getTooltipMessage('invite')}</p>
                </TooltipContent>
              )}
            </Tooltip>

            {/* Edit Button with permission check and tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Link href={canEdit ? `/research/panels/${id}/edit` : '#'} className={!canEdit ? 'pointer-events-none' : ''}>
                    <Button variant="outline" disabled={!canEdit}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                </span>
              </TooltipTrigger>
              {!canEdit && (
                <TooltipContent>
                  <p>{getTooltipMessage('edit')}</p>
                </TooltipContent>
              )}
            </Tooltip>

            {/* Archive Button with permission check and tooltip */}
            {!panel.archived && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="outline"
                      onClick={handleArchive}
                      disabled={!canDelete}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canDelete && (
                  <TooltipContent>
                    <p>{getTooltipMessage('delete')}</p>
                  </TooltipContent>
                )}
              </Tooltip>
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
              <PanelMemberList
                members={members}
                canManage={canInviteMembers}
                onRemoveMember={handleRemoveMember}
                onInviteMembers={() => setInviteDialogOpen(true)}
                isLoading={loadingMembers}
              />
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
          panelId={id}
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          onSuccess={handleInviteSuccess}
        />
      </div>
    </TooltipProvider>
  );
}
