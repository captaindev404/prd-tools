'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge as BadgePrimitive } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, Lock } from 'lucide-react';

interface Badge {
  id: string;
  key: string;
  name: string;
  description: string;
  tier: string;
  category: string;
  iconUrl: string | null;
  requirement: number;
  points: number;
}

interface UserBadge {
  id: string;
  progress: number;
  earnedAt: string | null;
  badge: Badge;
}

export function BadgeCollection() {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const response = await fetch('/api/gamification/badges?type=progress');
      if (response.ok) {
        const data = await response.json();
        setBadges(data.progress || []);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
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
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const earnedBadges = badges.filter((b) => b.earnedAt);
  const inProgressBadges = badges.filter((b) => !b.earnedAt);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return 'text-orange-600';
      case 'silver':
        return 'text-gray-400';
      case 'gold':
        return 'text-yellow-500';
      case 'platinum':
        return 'text-purple-500';
      default:
        return 'text-gray-400';
    }
  };

  const getBadgeIcon = (badge: UserBadge) => {
    if (badge.earnedAt) {
      return <Award className={`h-12 w-12 ${getTierColor(badge.badge.tier)}`} />;
    }
    return <Lock className="h-12 w-12 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Earned Badges ({earnedBadges.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {earnedBadges.map((userBadge) => (
                <div
                  key={userBadge.id}
                  className="flex flex-col items-center p-4 border rounded-lg bg-gradient-to-br from-white to-gray-50"
                >
                  {getBadgeIcon(userBadge)}
                  <p className="mt-2 text-sm font-semibold text-center">
                    {userBadge.badge.name}
                  </p>
                  <BadgePrimitive variant="secondary" className="mt-1 text-xs">
                    {userBadge.badge.tier}
                  </BadgePrimitive>
                  <p className="mt-2 text-xs text-center text-muted-foreground">
                    {userBadge.badge.description}
                  </p>
                  <p className="mt-1 text-xs text-green-600 font-medium">
                    +{userBadge.badge.points} points
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* In Progress Badges */}
      {inProgressBadges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inProgressBadges.map((userBadge) => {
                const progressPercent =
                  (userBadge.progress / userBadge.badge.requirement) * 100;

                return (
                  <div key={userBadge.id} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-4">
                      <div className="opacity-50">{getBadgeIcon(userBadge)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{userBadge.badge.name}</p>
                          <BadgePrimitive variant="outline" className="text-xs">
                            {userBadge.badge.tier}
                          </BadgePrimitive>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {userBadge.badge.description}
                        </p>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>
                              {userBadge.progress} / {userBadge.badge.requirement}
                            </span>
                            <span className="text-muted-foreground">
                              {Math.round(progressPercent)}%
                            </span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {badges.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Start contributing to earn badges!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
