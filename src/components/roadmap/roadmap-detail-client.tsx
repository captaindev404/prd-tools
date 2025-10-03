'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PublishDialog } from './publish-dialog';
import { Send } from 'lucide-react';
import type { RoadmapItem } from '@/types/roadmap';

interface RoadmapDetailClientProps {
  roadmapItem: RoadmapItem;
}

export function RoadmapDetailClient({ roadmapItem }: RoadmapDetailClientProps) {
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setPublishDialogOpen(true)}
        className="w-full"
      >
        <Send className="mr-2 h-4 w-4" />
        Publish Update
      </Button>

      <PublishDialog
        roadmapItem={roadmapItem}
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        onSuccess={() => {
          // Optionally refresh the page or show a success message
        }}
      />
    </>
  );
}
