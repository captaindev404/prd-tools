import { Metadata } from 'next';
import { Leaderboard } from '@/components/gamification/Leaderboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Target, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Leaderboard | Gentil Feedback',
  description: 'See how you rank against other contributors',
};

export default function LeaderboardPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">
          See how you rank against other contributors across different categories
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Cards */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Competition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Rankings update hourly based on your contributions and engagement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-blue-500" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Compete in overall rankings or specialize in feedback, voting, or research
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-green-500" />
              Periods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track weekly, monthly, or all-time rankings to see your progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <div className="mt-6">
        <Leaderboard />
      </div>

      {/* How Points Work */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How Points Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Point Values</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Submit Feedback: +10 points</li>
                <li>Vote on Feedback: +2 points</li>
                <li>Complete Questionnaire: +15 points</li>
                <li>Participate in Session: +30 points</li>
                <li>Quality Bonus: +5 points</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Bonus Points</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Earn badges for bonus points</li>
                <li>Unlock achievements for rewards</li>
                <li>Level up to gain recognition</li>
                <li>Quality contributions earn bonuses</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
