import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FeatureStatusBadge } from './feature-status-badge';
import { ProductAreaBadge } from './product-area-badge';
import { MessageSquare, MapPin } from 'lucide-react';
import type { FeatureStatus, ProductArea } from '@prisma/client';

export interface FeatureCardData {
  id: string;
  title: string;
  description?: string | null;
  area: ProductArea;
  status: FeatureStatus;
  feedbackCount: number;
  roadmapItemCount: number;
}

interface FeatureCardProps {
  feature: FeatureCardData;
}

export function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <Link href={`/features/${feature.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-2 mb-2">
            <ProductAreaBadge area={feature.area} />
            <FeatureStatusBadge status={feature.status} />
          </div>
          <CardTitle className="text-lg line-clamp-2">{feature.title}</CardTitle>
          {feature.description && (
            <CardDescription className="line-clamp-2 mt-2">
              {feature.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>
                {feature.feedbackCount} {feature.feedbackCount === 1 ? 'feedback' : 'feedbacks'}
              </span>
            </div>
            {feature.roadmapItemCount > 0 && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>
                  {feature.roadmapItemCount} roadmap {feature.roadmapItemCount === 1 ? 'item' : 'items'}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
