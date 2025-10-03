import { Badge } from '@/components/ui/badge';
import type { ProductArea } from '@prisma/client';

interface ProductAreaBadgeProps {
  area: ProductArea;
  className?: string;
}

const AREA_CONFIG: Record<
  ProductArea,
  {
    label: string;
    className: string;
  }
> = {
  Reservations: {
    label: 'Reservations',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  CheckIn: {
    label: 'Check-in',
    className: 'bg-green-50 text-green-700 border-green-200',
  },
  Payments: {
    label: 'Payments',
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
  Housekeeping: {
    label: 'Housekeeping',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  Backoffice: {
    label: 'Backoffice',
    className: 'bg-gray-50 text-gray-700 border-gray-200',
  },
};

export function ProductAreaBadge({ area, className }: ProductAreaBadgeProps) {
  const config = AREA_CONFIG[area];

  return (
    <Badge variant="outline" className={`${config.className} ${className || ''}`}>
      {config.label}
    </Badge>
  );
}
