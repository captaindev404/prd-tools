'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, Edit, Archive } from 'lucide-react';
import type { Role } from '@prisma/client';

export interface PanelCardData {
  id: string;
  name: string;
  description?: string | null;
  memberCount: number;
  sizeTarget?: number | null;
  archived: boolean;
  creator: {
    id: string;
    displayName?: string | null;
    email: string;
    role: Role;
  } | null;
  createdById?: string;
  createdAt: Date | string;
}

interface PanelCardProps {
  panel: PanelCardData;
  currentUserId?: string;
  canEdit?: boolean;
  canArchive?: boolean;
  onEdit?: (panelId: string) => void;
  onArchive?: (panelId: string) => void;
}

/**
 * PanelCard component for displaying research panels in list/grid views.
 *
 * Features:
 * - Shows panel name, description (truncated), creator, and member count
 * - Displays archived badge for archived panels
 * - Links to panel detail page
 * - Optional edit and archive buttons with permission checks
 * - Fully responsive design
 */
export function PanelCard({
  panel,
  currentUserId,
  canEdit = false,
  canArchive = false,
  onEdit,
  onArchive
}: PanelCardProps) {
  const truncateDescription = (text: string | null | undefined, maxLength: number = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) {
      onEdit(panel.id);
    }
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onArchive) {
      onArchive(panel.id);
    }
  };

  return (
    <Link href={`/research/panels/${panel.id}`} className="block h-full">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
        <CardHeader className="flex-none">
          <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {panel.archived && (
                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                  <Archive className="h-3 w-3 mr-1" />
                  Archived
                </Badge>
              )}
              {panel.sizeTarget && (
                <Badge variant="outline">
                  Target: {panel.sizeTarget}
                </Badge>
              )}
            </div>
          </div>
          <CardTitle className="text-lg line-clamp-2">{panel.name}</CardTitle>
          {panel.description && (
            <CardDescription className="line-clamp-2 mt-2">
              {truncateDescription(panel.description, 120)}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>
                {panel.memberCount} {panel.memberCount === 1 ? 'member' : 'members'}
              </span>
            </div>
            {panel.creator && (
              <div className="text-xs truncate ml-2">
                by {panel.creator.displayName || panel.creator.email.split('@')[0]}
              </div>
            )}
          </div>

          {(canEdit || canArchive) && (
            <div className="flex gap-2 pt-3 border-t">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleEdit}
                  aria-label={`Edit ${panel.name}`}
                >
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              )}
              {canArchive && !panel.archived && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleArchive}
                  aria-label={`Archive ${panel.name}`}
                >
                  <Archive className="h-3.5 w-3.5 mr-1.5" />
                  <span className="hidden sm:inline">Archive</span>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
