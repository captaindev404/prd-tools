import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimelineView } from '@/components/roadmap/TimelineView';

export const metadata: Metadata = {
  title: 'Timeline View - Roadmap',
  description: 'Visualize roadmap items in a timeline Gantt chart',
};

export default function TimelinePage() {
  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Link href="/roadmap">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Roadmap
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Timeline View</h1>
          <p className="mt-2 text-muted-foreground">
            Visualize roadmap progress and target dates in a Gantt-style timeline
          </p>
        </div>
      </div>

      {/* Timeline Component */}
      <TimelineView />
    </div>
  );
}
