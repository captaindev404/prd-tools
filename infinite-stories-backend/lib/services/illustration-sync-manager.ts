import { prisma } from '@/lib/prisma/client';

/**
 * Illustration synchronization manager for audio-timeline coordination
 */

export interface IllustrationSyncData {
  illustrationId: string;
  imageUrl: string;
  audioTimestamp: number;
  audioDuration: number;
  displayOrder: number;
}

/**
 * Get illustrations synchronized with audio timeline
 */
export async function getIllustrationTimeline(
  storyId: string
): Promise<IllustrationSyncData[]> {
  const illustrations = await prisma.storyIllustration.findMany({
    where: {
      storyId,
      generationStatus: 'completed',
    },
    select: {
      id: true,
      imageUrl: true,
      audioTimestamp: true,
      audioDuration: true,
      displayOrder: true,
    },
    orderBy: {
      audioTimestamp: 'asc',
    },
  });

  return illustrations.map((ill) => ({
    illustrationId: ill.id,
    imageUrl: ill.imageUrl,
    audioTimestamp: ill.audioTimestamp,
    audioDuration: ill.audioDuration || 0,
    displayOrder: ill.displayOrder,
  }));
}

/**
 * Get current illustration based on audio timestamp
 */
export function getCurrentIllustration(
  illustrations: IllustrationSyncData[],
  currentTimestamp: number
): IllustrationSyncData | null {
  if (illustrations.length === 0) return null;

  // Find illustration that matches current timestamp
  for (let i = illustrations.length - 1; i >= 0; i--) {
    if (currentTimestamp >= illustrations[i].audioTimestamp) {
      return illustrations[i];
    }
  }

  // Default to first illustration
  return illustrations[0];
}

/**
 * Calculate progress through current illustration
 */
export function getIllustrationProgress(
  illustration: IllustrationSyncData,
  currentTimestamp: number
): number {
  const elapsed = currentTimestamp - illustration.audioTimestamp;
  const duration = illustration.audioDuration;

  if (duration === 0) return 0;

  const progress = Math.min(100, Math.max(0, (elapsed / duration) * 100));
  return Math.round(progress);
}
