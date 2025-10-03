'use client';

import * as React from 'react';
import { Trash2, Search, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

// Type definitions
export interface PanelMember {
  id: string;
  userId: string;
  status?: string;
  joinedAt: Date;
  acceptedAt?: Date | null;
  active: boolean;
  user: {
    id: string;
    displayName: string | null;
    email: string;
    role: string;
    currentVillageId: string | null;
    currentVillage?: {
      id: string;
      name: string;
    } | null;
  };
}

interface MemberListProps {
  // Panel ID for API calls
  panelId: string;

  // Members data
  members: PanelMember[];

  // Callbacks
  onMemberRemove?: (userId: string) => Promise<void>;
  onRefresh?: () => Promise<void>;

  // State
  isLoading?: boolean;

  // Pagination
  itemsPerPage?: number;
}

const ITEMS_PER_PAGE = 50;

// Helper to get consent status badge
function getConsentStatusBadge(member: PanelMember) {
  // For now, we assume active members have consented
  // In a real implementation, check actual consent data
  if (member.active && member.acceptedAt) {
    return (
      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
        Consented
      </Badge>
    );
  }

  if (member.status === 'invited') {
    return <Badge variant="secondary">Pending</Badge>;
  }

  if (member.status === 'declined') {
    return <Badge variant="outline">Declined</Badge>;
  }

  return <Badge variant="secondary">Unknown</Badge>;
}

// Helper to format date
function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function MemberList({
  panelId,
  members,
  onMemberRemove,
  onRefresh,
  isLoading = false,
  itemsPerPage = ITEMS_PER_PAGE,
}: MemberListProps) {
  // State
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [memberToDelete, setMemberToDelete] = React.useState<PanelMember | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // Filter members based on search query
  const filteredMembers = React.useMemo(() => {
    if (!searchQuery.trim()) return members;

    const query = searchQuery.toLowerCase();
    return members.filter((member) => {
      const name = member.user.displayName?.toLowerCase() || '';
      const email = member.user.email.toLowerCase();
      const role = member.user.role.toLowerCase();
      const village = member.user.currentVillage?.name.toLowerCase() || '';

      return (
        name.includes(query) ||
        email.includes(query) ||
        role.includes(query) ||
        village.includes(query)
      );
    });
  }, [members, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

  // Reset to page 1 when search query changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Handle delete confirmation
  const handleDeleteClick = (member: PanelMember) => {
    setMemberToDelete(member);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete || !onMemberRemove) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await onMemberRemove(memberToDelete.userId);
      setMemberToDelete(null);

      // Refresh the list if callback provided
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error removing member:', error);
      setDeleteError(
        error instanceof Error ? error.message : 'Failed to remove member. Please try again.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setMemberToDelete(null);
    setDeleteError(null);
  };

  // Handle pagination
  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  // Show empty state
  if (members.length === 0 && !isLoading) {
    return (
      <EmptyState
        icon={Users}
        title="No members yet"
        description="This panel doesn't have any members. Invite users to get started."
      />
    );
  }

  // Show empty search results
  if (filteredMembers.length === 0 && searchQuery) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, role, or village..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <EmptyState
          icon={Search}
          title="No results found"
          description={`No members match "${searchQuery}". Try a different search term.`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, role, or village..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {startIndex + 1}-{Math.min(endIndex, filteredMembers.length)} of{' '}
        {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
        {searchQuery && ` (filtered from ${members.length} total)`}
      </div>

      {/* Members Table */}
      <div className="relative border rounded-lg">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Village</TableHead>
              <TableHead>Consent Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  {member.user.displayName || 'Unknown User'}
                </TableCell>
                <TableCell className="text-muted-foreground">{member.user.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{member.user.role}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {member.user.currentVillage?.name || 'N/A'}
                </TableCell>
                <TableCell>{getConsentStatusBadge(member)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(member.joinedAt)}
                </TableCell>
                <TableCell>
                  {onMemberRemove && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(member)}
                      disabled={isLoading}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="sr-only">Remove member</span>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && handleDeleteCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove panel member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <span className="font-medium text-foreground">
                {memberToDelete?.user.displayName || memberToDelete?.user.email}
              </span>{' '}
              from this panel? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {deleteError}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className={cn(
                'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                isDeleting && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Member'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
