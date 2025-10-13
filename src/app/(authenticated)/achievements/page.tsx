import { Metadata } from 'next';
import { PointsDisplay } from '@/components/gamification/PointsDisplay';
import { BadgeCollection } from '@/components/gamification/BadgeCollection';
import { AchievementProgress } from '@/components/gamification/AchievementProgress';

export const metadata: Metadata = {
  title: 'Achievements | Gentil Feedback',
  description: 'View your points, badges, and achievements',
};

export default function AchievementsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Achievements</h1>
        <p className="text-muted-foreground">
          Track your progress, earn badges, and unlock achievements by contributing to the platform
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Points */}
        <div className="lg:col-span-1">
          <PointsDisplay />
        </div>

        {/* Right Column - Badges and Achievements */}
        <div className="lg:col-span-2 space-y-6">
          <BadgeCollection />
          <AchievementProgress />
        </div>
      </div>
    </div>
  );
}
