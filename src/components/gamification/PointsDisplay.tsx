'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, TrendingUp, Award } from 'lucide-react';

interface UserPoints {
  totalPoints: number;
  feedbackPoints: number;
  votingPoints: number;
  researchPoints: number;
  qualityPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  level: number;
  nextLevelThreshold: number;
  pointsToNextLevel: number;
}

export function PointsDisplay() {
  const [points, setPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPoints();
  }, []);

  const fetchPoints = async () => {
    try {
      const response = await fetch('/api/gamification/points');
      if (response.ok) {
        const data = await response.json();
        setPoints(data);
      }
    } catch (error) {
      console.error('Error fetching points:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!points) {
    return null;
  }

  const progressPercentage = ((points.totalPoints / points.nextLevelThreshold) * 100);

  return (
    <div className="space-y-4">
      {/* Main Points Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Your Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Total Points */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{points.totalPoints.toLocaleString()}</span>
                <span className="text-muted-foreground">total points</span>
              </div>
            </div>

            {/* Level Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Level {points.level}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {points.pointsToNextLevel} to Level {points.level + 1}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* Points Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Feedback</p>
                <p className="text-2xl font-semibold">{points.feedbackPoints}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Voting</p>
                <p className="text-2xl font-semibold">{points.votingPoints}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Research</p>
                <p className="text-2xl font-semibold">{points.researchPoints}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Quality</p>
                <p className="text-2xl font-semibold">{points.qualityPoints}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Period Points */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">This Week</span>
            </div>
            <p className="text-2xl font-bold">{points.weeklyPoints}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">This Month</span>
            </div>
            <p className="text-2xl font-bold">{points.monthlyPoints}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
