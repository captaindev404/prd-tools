'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, Lock, Sparkles } from 'lucide-react';

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  iconUrl: string | null;
  requirement: string;
  points: number;
  hidden: boolean;
}

interface UserAchievement {
  id: string;
  progress: string;
  earnedAt: string | null;
  achievement: Achievement;
}

export function AchievementProgress() {
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const response = await fetch('/api/gamification/achievements?type=progress');
      if (response.ok) {
        const data = await response.json();
        setAchievements(data.progress || []);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
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
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const earnedAchievements = achievements.filter((a) => a.earnedAt);
  const inProgressAchievements = achievements.filter((a) => !a.earnedAt && !a.achievement.hidden);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'streak':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'milestone':
        return <Sparkles className="h-5 w-5 text-blue-500" />;
      case 'special':
        return <Star className="h-5 w-5 text-purple-500" />;
      default:
        return <Star className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Earned Achievements */}
      {earnedAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unlocked Achievements ({earnedAchievements.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {earnedAchievements.map((userAchievement) => (
                <div
                  key={userAchievement.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200"
                >
                  <div className="mt-1">
                    {getCategoryIcon(userAchievement.achievement.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{userAchievement.achievement.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {userAchievement.achievement.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {userAchievement.achievement.description}
                    </p>
                    <p className="text-sm text-green-600 font-medium mt-2">
                      +{userAchievement.achievement.points} points earned
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* In Progress Achievements */}
      {inProgressAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inProgressAchievements.map((userAchievement) => {
                const requirement = JSON.parse(userAchievement.achievement.requirement);
                const progress = JSON.parse(userAchievement.progress);

                // Calculate progress percentage
                let progressPercent = 0;
                let progressText = '';

                if (requirement.consecutiveDays) {
                  progressPercent = (progress.consecutiveDays / requirement.consecutiveDays) * 100;
                  progressText = `${progress.consecutiveDays} / ${requirement.consecutiveDays} days`;
                } else if (requirement.level) {
                  progressPercent = (progress.level / requirement.level) * 100;
                  progressText = `Level ${progress.level} / ${requirement.level}`;
                } else if (requirement.totalPoints) {
                  progressPercent = (progress.totalPoints / requirement.totalPoints) * 100;
                  progressText = `${progress.totalPoints.toLocaleString()} / ${requirement.totalPoints.toLocaleString()} points`;
                } else if (requirement.feedbackCount) {
                  progressPercent = (progress.feedbackCount / requirement.feedbackCount) * 100;
                  progressText = `${progress.feedbackCount} / ${requirement.feedbackCount} feedback`;
                }

                return (
                  <div key={userAchievement.id} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 opacity-50">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{userAchievement.achievement.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {userAchievement.achievement.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {userAchievement.achievement.description}
                        </p>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>{progressText}</span>
                            <span className="text-muted-foreground">
                              {Math.round(progressPercent)}%
                            </span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          +{userAchievement.achievement.points} points when unlocked
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {achievements.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Start contributing to unlock achievements!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
