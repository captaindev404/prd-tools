'use client';

import * as React from 'react';
import { MemberList, type PanelMember } from './MemberList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// Mock data for demonstration
const MOCK_MEMBERS: PanelMember[] = [
  {
    id: 'mem_01',
    userId: 'usr_01',
    status: 'accepted',
    joinedAt: new Date('2024-01-15'),
    acceptedAt: new Date('2024-01-15'),
    active: true,
    user: {
      id: 'usr_01',
      displayName: 'Sarah Johnson',
      email: 'sarah.johnson@clubmed.com',
      role: 'PM',
      currentVillageId: 'vil_01',
      currentVillage: {
        id: 'vil_01',
        name: 'Punta Cana',
      },
    },
  },
  {
    id: 'mem_02',
    userId: 'usr_02',
    status: 'accepted',
    joinedAt: new Date('2024-01-16'),
    acceptedAt: new Date('2024-01-17'),
    active: true,
    user: {
      id: 'usr_02',
      displayName: 'Michael Chen',
      email: 'michael.chen@clubmed.com',
      role: 'USER',
      currentVillageId: 'vil_02',
      currentVillage: {
        id: 'vil_02',
        name: 'Cancun',
      },
    },
  },
  {
    id: 'mem_03',
    userId: 'usr_03',
    status: 'invited',
    joinedAt: new Date('2024-01-18'),
    acceptedAt: null,
    active: false,
    user: {
      id: 'usr_03',
      displayName: 'Emma Wilson',
      email: 'emma.wilson@clubmed.com',
      role: 'USER',
      currentVillageId: 'vil_01',
      currentVillage: {
        id: 'vil_01',
        name: 'Punta Cana',
      },
    },
  },
  {
    id: 'mem_04',
    userId: 'usr_04',
    status: 'accepted',
    joinedAt: new Date('2024-01-20'),
    acceptedAt: new Date('2024-01-21'),
    active: true,
    user: {
      id: 'usr_04',
      displayName: 'James Smith',
      email: 'james.smith@clubmed.com',
      role: 'RESEARCHER',
      currentVillageId: 'vil_03',
      currentVillage: {
        id: 'vil_03',
        name: 'Bali',
      },
    },
  },
  {
    id: 'mem_05',
    userId: 'usr_05',
    status: 'declined',
    joinedAt: new Date('2024-01-22'),
    acceptedAt: null,
    active: false,
    user: {
      id: 'usr_05',
      displayName: 'Lisa Anderson',
      email: 'lisa.anderson@clubmed.com',
      role: 'USER',
      currentVillageId: 'vil_02',
      currentVillage: {
        id: 'vil_02',
        name: 'Cancun',
      },
    },
  },
];

interface MemberListExampleProps {
  // Panel ID for real API integration
  panelId?: string;
  // Use mock data instead of API
  useMockData?: boolean;
}

export function MemberListExample({ panelId = 'pan_demo', useMockData = true }: MemberListExampleProps) {
  const [members, setMembers] = React.useState<PanelMember[]>(useMockData ? MOCK_MEMBERS : []);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  // Fetch members from API
  const fetchMembers = React.useCallback(async () => {
    if (useMockData) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/panels/${panelId}/members`);
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      const data = await response.json();
      setMembers(data.data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load panel members. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [panelId, useMockData, toast]);

  // Load members on mount (if not using mock data)
  React.useEffect(() => {
    if (!useMockData) {
      fetchMembers();
    }
  }, [useMockData, fetchMembers]);

  // Handle member removal
  const handleMemberRemove = async (userId: string) => {
    if (useMockData) {
      // Simulate API call with mock data
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMembers((prev) => prev.filter((m) => m.userId !== userId));

      toast({
        title: 'Member removed',
        description: 'The member has been successfully removed from the panel.',
      });
      return;
    }

    // Real API call
    const response = await fetch(`/api/panels/${panelId}/members/${userId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove member');
    }

    toast({
      title: 'Member removed',
      description: 'The member has been successfully removed from the panel.',
    });
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (useMockData) {
      toast({
        title: 'Refreshed',
        description: 'Member list refreshed successfully.',
      });
      return;
    }

    await fetchMembers();
    toast({
      title: 'Refreshed',
      description: 'Member list refreshed successfully.',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Panel Members</CardTitle>
              <CardDescription>
                {useMockData
                  ? 'Viewing mock data for demonstration'
                  : `Managing members for panel: ${panelId}`}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <MemberList
            panelId={panelId}
            members={members}
            onMemberRemove={handleMemberRemove}
            onRefresh={handleRefresh}
            isLoading={isLoading}
            itemsPerPage={50}
          />
        </CardContent>
      </Card>

      {/* Integration Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Guide</CardTitle>
          <CardDescription>How to integrate MemberList into your pages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 font-mono text-sm">
            <pre className="whitespace-pre-wrap">
{`import { MemberList, type PanelMember } from '@/components/research/MemberList';

// In your component:
const [members, setMembers] = useState<PanelMember[]>([]);
const [isLoading, setIsLoading] = useState(false);

// Fetch members from API
const fetchMembers = async () => {
  setIsLoading(true);
  try {
    const response = await fetch(\`/api/panels/\${panelId}/members\`);
    const data = await response.json();
    setMembers(data.data || []);
  } catch (error) {
    console.error('Error fetching members:', error);
  } finally {
    setIsLoading(false);
  }
};

// Handle member removal
const handleMemberRemove = async (userId: string) => {
  const response = await fetch(
    \`/api/panels/\${panelId}/members/\${userId}\`,
    { method: 'DELETE' }
  );

  if (!response.ok) {
    throw new Error('Failed to remove member');
  }

  // Optionally refresh the list
  await fetchMembers();
};

// Render component
<MemberList
  panelId={panelId}
  members={members}
  onMemberRemove={handleMemberRemove}
  onRefresh={fetchMembers}
  isLoading={isLoading}
  itemsPerPage={50}
/>`}
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Features included:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Table view with name, email, role, village, and consent status</li>
              <li>Client-side search filtering across all columns</li>
              <li>Pagination (configurable, default 50 items per page)</li>
              <li>Remove button with confirmation dialog</li>
              <li>Loading states during data fetch and operations</li>
              <li>Empty state when no members exist</li>
              <li>Empty search results state</li>
              <li>Error handling in delete operations</li>
              <li>Accessible with keyboard navigation and screen reader support</li>
              <li>Responsive design for mobile, tablet, and desktop</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">API Endpoints used:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>
                <code className="bg-muted px-1 py-0.5 rounded">GET /api/panels/[id]/members</code> -
                Fetch panel members
              </li>
              <li>
                <code className="bg-muted px-1 py-0.5 rounded">
                  DELETE /api/panels/[id]/members/[userId]
                </code>{' '}
                - Remove member from panel
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
