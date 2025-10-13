'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, TrendingUp } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  points: number;
  level: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  userPosition: LeaderboardEntry | null;
  period: string;
  category: string;
}

export function Leaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('all_time');
  const [category, setCategory] = useState<'overall' | 'feedback' | 'voting' | 'research'>('overall');

  useEffect(() => {
    fetchLeaderboard();
  }, [period, category]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/gamification/leaderboard?period=${period}&category=${category}&limit=50`
      );
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-orange-600" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="all_time">All Time</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mt-4 flex gap-2">
          {['overall', 'feedback', 'voting', 'research'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat as any)}
              className={`px-3 py-1 rounded-full text-sm ${
                category === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* User's Position */}
        {data.userPosition && data.userPosition.rank > 10 && (
          <div className="my-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium mb-2">Your Position</p>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold">#{data.userPosition.rank}</span>
              <Avatar className="h-8 w-8">
                <AvatarImage src={data.userPosition.avatarUrl || undefined} />
                <AvatarFallback>
                  {data.userPosition.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{data.userPosition.displayName}</p>
              </div>
              <span className="font-bold">{data.userPosition.points.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="mt-6 space-y-2">
          {data.leaderboard.map((entry) => (
            <div
              key={entry.userId}
              className={`flex items-center gap-3 p-3 rounded-lg border ${getRankBg(entry.rank)}`}
            >
              <div className="flex items-center justify-center w-8">
                {getRankIcon(entry.rank)}
              </div>

              <Avatar className="h-10 w-10">
                <AvatarImage src={entry.avatarUrl || undefined} />
                <AvatarFallback>{entry.displayName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{entry.displayName}</p>
                <p className="text-xs text-muted-foreground">
                  Level {entry.level} • {entry.role}
                </p>
              </div>

              <div className="text-right">
                <p className="font-bold text-lg">{entry.points.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>
          ))}
        </div>

        {data.leaderboard.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No leaderboard data available yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
