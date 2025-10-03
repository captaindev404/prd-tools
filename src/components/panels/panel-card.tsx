import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import type { Role } from '@prisma/client';

export interface PanelCardData {
  id: string;
  name: string;
  memberCount: number;
  sizeTarget?: number | null;
  creator: {
    id: string;
    displayName?: string | null;
    email: string;
    role: Role;
  } | null;
  createdAt: Date | string;
}

interface PanelCardProps {
  panel: PanelCardData;
}

export function PanelCard({ panel }: PanelCardProps) {
  return (
    <Link href={`/research/panels/${panel.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-2 mb-2">
            {panel.sizeTarget && (
              <Badge variant="outline">
                Target: {panel.sizeTarget}
              </Badge>
            )}
          </div>
          <CardTitle className="text-lg line-clamp-2">{panel.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>
                {panel.memberCount} {panel.memberCount === 1 ? 'member' : 'members'}
              </span>
            </div>
            {panel.creator && (
              <div className="text-xs">
                by {panel.creator.displayName || panel.creator.email}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
