import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSettingsStore } from '@/store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { Target, Flame, Trophy, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const settings = useSettingsStore((s) => s.settings);
  const problems = useLiveQuery(() => db.problems.toArray(), []) ?? [];
  const contests = useLiveQuery(() => db.contests.toArray(), []) ?? [];

  const solved = problems.filter((p) => p.status !== 'not_solved').length;
  const mastered = problems.filter((p) => p.status === 'mastered').length;
  const progressPercent = settings
    ? Math.min(100, Math.round((settings.currentRating / settings.targetRating) * 100))
    : 0;

  const totalRatingChange = contests.reduce((sum, c) => sum + c.ratingChange, 0);

  return (
    <AppLayout title="Profile" description="Your competitive programming identity">
      <div className="max-w-3xl space-y-6">
        <Card className="cf-roundbox overflow-hidden">
          <div className="cf-roundbox-header bg-cf-header text-white">Profile</div>
          <CardContent className="relative pt-4 pb-6">
            <div className="flex items-end gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[5px] bg-cf-header text-white text-xl font-bold border border-[#1a5f8a]">
                CF
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold">{settings?.username ?? 'Competitive Coder'}</h2>
                <p className="text-sm text-muted-foreground">@{settings?.handle ?? 'cf_user'}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-background/50">
                <p className="text-2xl font-bold text-primary">{settings?.currentRating}</p>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <p className="text-2xl font-bold">{solved}</p>
                <p className="text-xs text-muted-foreground">Solved</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <p className="text-2xl font-bold text-cf-green">{mastered}</p>
                <p className="text-xs text-muted-foreground">Mastered</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <p className="text-2xl font-bold text-cf-orange">{settings?.practiceStreak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cf-roundbox">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>{settings?.currentRating} → {settings?.targetRating}</span>
              <Badge>{progressPercent}%</Badge>
            </div>
            <Progress value={progressPercent} />
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="cf-roundbox">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Flame className="h-4 w-4 text-cf-orange" />
                Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{settings?.practiceStreak} days</p>
              <p className="text-sm text-muted-foreground mt-1">Current practice streak</p>
            </CardContent>
          </Card>

          <Card className="cf-roundbox">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-cf-orange" />
                Contests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{contests.length}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Total rating change: {totalRatingChange >= 0 ? '+' : ''}
                {totalRatingChange}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="cf-roundbox">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-cf-green" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {solved >= 5 && <Badge variant="success">First 5 Solved</Badge>}
              {mastered >= 3 && <Badge variant="success">Pattern Master</Badge>}
              {(settings?.practiceStreak ?? 0) >= 7 && (
                <Badge variant="warning">7-Day Streak</Badge>
              )}
              {contests.length >= 3 && <Badge variant="default">Contest Regular</Badge>}
              {totalRatingChange > 50 && <Badge variant="success">Rising Star</Badge>}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
