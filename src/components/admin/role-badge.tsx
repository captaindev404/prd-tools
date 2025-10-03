import { Badge } from '@/components/ui/badge';
import type { Role } from '@prisma/client';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

const roleStyles: Record<Role, string> = {
  ADMIN: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200',
  MODERATOR: 'bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200',
  PM: 'bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200',
  PO: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-indigo-200',
  RESEARCHER: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200',
  USER: 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200',
};

const roleLabels: Record<Role, string> = {
  ADMIN: 'Admin',
  MODERATOR: 'Moderator',
  PM: 'Product Manager',
  PO: 'Product Owner',
  RESEARCHER: 'Researcher',
  USER: 'User',
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(roleStyles[role], className)}
    >
      {roleLabels[role]}
    </Badge>
  );
}
