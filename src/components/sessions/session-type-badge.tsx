import { SessionType } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, MessageSquare, Palette } from 'lucide-react';

interface SessionTypeBadgeProps {
  type: SessionType;
  className?: string;
}

const sessionTypeConfig = {
  [SessionType.usability]: {
    label: 'Usability Test',
    icon: FlaskConical,
    variant: 'default' as const,
  },
  [SessionType.interview]: {
    label: 'Interview',
    icon: MessageSquare,
    variant: 'secondary' as const,
  },
  [SessionType.prototype_walkthrough]: {
    label: 'Prototype',
    icon: Palette,
    variant: 'outline' as const,
  },
  [SessionType.remote_test]: {
    label: 'Remote Test',
    icon: FlaskConical,
    variant: 'default' as const,
  },
};

export function SessionTypeBadge({ type, className }: SessionTypeBadgeProps) {
  const config = sessionTypeConfig[type];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
