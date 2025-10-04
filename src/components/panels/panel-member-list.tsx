'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { EmptyState } from '@/components/ui/empty-state';
import { Trash2, Check, X, AlertTriangle, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import type { Role } from '@prisma/client';

interface PanelMember {
  id: string;
  userId: string;
  active: boolean;
  joinedAt: Date | string;
  user: {
    id: string;
    displayName?: string | null;
    email: string;
    role: Role;
    consents: string; // JSON array of consent types
    currentVillage?: {
      id: string;
      name: string;
    } | null;
  };
  invitedBy?: {
    id: string;
    displayName?: string | null;
    email: string;
  } | null;
}

type ConsentType = 'research_contact' | 'usage_analytics' | 'email_updates';

const CONSENT_LABELS: Record<ConsentType, string> = {
  research_contact: 'Research Contact',
  usage_analytics: 'Analytics Tracking',
  email_updates: 'Email Updates',
};

const REQUIRED_CONSENTS: ConsentType[] = ['research_contact'];

interface PanelMemberListProps {
  members: PanelMember[];
  canManage: boolean;
  onRemoveMember?: (userId: string) => void;
  onInviteMembers?: () => void;
  isLoading?: boolean;
}

function getStatusBadge(active: boolean) {
  return active
    ? <Badge variant="default">Active</Badge>
    : <Badge variant="secondary">Inactive</Badge>;
}

function parseConsents(consentsJson: string): ConsentType[] {
  try {
    const parsed = JSON.parse(consentsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function hasConsent(userConsents: ConsentType[], consentType: ConsentType): boolean {
  return userConsents.includes(consentType);
}

function hasMissingRequiredConsent(userConsents: ConsentType[]): boolean {
  return REQUIRED_CONSENTS.some(consent => !userConsents.includes(consent));
}

interface ConsentBadgeProps {
  consentType: ConsentType;
  granted: boolean;
}

function ConsentBadge({ consentType, granted }: ConsentBadgeProps) {
  const Icon = granted ? Check : X;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          className={
            granted
              ? 'bg-green-100 text-green-800 hover:bg-green-100/80 border-green-200'
              : 'bg-red-100 text-red-800 hover:bg-red-100/80 border-red-200'
          }
        >
          <Icon className="h-3 w-3 mr-1" />
          <span className="sr-only">{CONSENT_LABELS[consentType]}</span>
          {consentType === 'research_contact' && 'R'}
          {consentType === 'usage_analytics' && 'A'}
          {consentType === 'email_updates' && 'E'}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>{CONSENT_LABELS[consentType]}: {granted ? 'Granted' : 'Not Granted'}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function PanelMemberList({ members, canManage, onRemoveMember, onInviteMembers, isLoading = false }: PanelMemberListProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg" role="status" aria-label="Loading panel members">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Village</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Consents</TableHead>
              <TableHead>Joined</TableHead>
              {canManage && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-3 w-[200px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-[80px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-[70px]" />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Skeleton className="h-6 w-[40px]" />
                    <Skeleton className="h-6 w-[40px]" />
                    <Skeleton className="h-6 w-[40px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-3 w-[80px]" />
                  </div>
                </TableCell>
                {canManage && (
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <EmptyState
        icon={UserPlus}
        title="No members yet"
        description="Invite members to get started with your research panel. Members will receive invitations based on eligibility criteria and can participate in studies, surveys, and feedback sessions."
        action={
          canManage && onInviteMembers
            ? {
                label: 'Invite Members',
                onClick: onInviteMembers,
                icon: UserPlus,
                variant: 'default',
              }
            : undefined
        }
        size="md"
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Village</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Consents</TableHead>
              <TableHead>Joined</TableHead>
              {canManage && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const userConsents = parseConsents(member.user.consents);
              const missingRequired = hasMissingRequiredConsent(userConsents);

              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{member.user.displayName || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">{member.user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{member.user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {member.user.currentVillage ? (
                      <span className="text-sm">{member.user.currentVillage.name}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(member.active)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 flex-wrap">
                      {missingRequired && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertTriangle className="h-4 w-4 text-amber-600 mr-1" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Missing required consent for research activities</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <ConsentBadge
                        consentType="research_contact"
                        granted={hasConsent(userConsents, 'research_contact')}
                      />
                      <ConsentBadge
                        consentType="usage_analytics"
                        granted={hasConsent(userConsents, 'usage_analytics')}
                      />
                      <ConsentBadge
                        consentType="email_updates"
                        granted={hasConsent(userConsents, 'email_updates')}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">
                        {format(new Date(member.joinedAt), 'MMM d, yyyy')}
                      </p>
                      {member.invitedBy && (
                        <p className="text-xs text-muted-foreground">
                          by {member.invitedBy.displayName || member.invitedBy.email}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      {member.active && onRemoveMember && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveMember(member.userId)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
