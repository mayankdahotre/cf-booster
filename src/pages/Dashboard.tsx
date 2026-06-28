import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import {
  Target,
  Flame,
  CheckCircle2,
  RotateCcw,
  Clock,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LearningHeatmap } from '@/components/charts/LearningHeatmap';
import {
  ChartCard,
  ProblemsByRatingChart,
  ProblemsByTopicChart,
  UsageDonutChart,
} from '@/components/charts';
import { db } from '@/db';
import { useSettingsStore } from '@/store';
import { cn, getRatingColor, getRatingBg } from '@/utils';
import { filterDueReviews, todayDateString } from '@/utils/reviews';
import { format } from 'date-fns';

export default function DashboardPage() {
  const settings = useSettingsStore((s) => s.settings);
  const contests = useLiveQuery(() => db.contests.toArray(), []) ?? [];
  const problems = useLiveQuery(() => db.problems.toArray(), []) ?? [];
  const reviews = useLiveQuery(() => db.reviews.toArray(), []) ?? [];
  const dailyTasks = useLiveQuery(() => db.dailyTasks.toArray(), []) ?? [];
  const mistakes = useLiveQuery(() => db.mistakes.toArray(), []) ?? [];

  const solvedProblems = problems.filter((p) => p.status !== 'not_solved');
  const dueReviews = filterDueReviews(reviews);
  const today = todayDateString();
  const todayTasks = dailyTasks.filter((t) => t.date === today && !t.completed);

  const lastContestChange =
    [...contests].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      ?.ratingChange ?? 0;

  const progressPercent = settings
    ? Math.min(100, Math.round((settings.currentRating / settings.targetRating) * 100))
    : 0;

  const weeklySolved = solvedProblems.filter((p) => {
    if (!p.solvedAt) return false;
    const days = (Date.now() - new Date(p.solvedAt).getTime()) / (1000 * 60 * 60 * 24);
    return days <= 7;
  }).length;

  const monthlySolved = solvedProblems.filter((p) => {
    if (!p.solvedAt) return false;
    const days = (Date.now() - new Date(p.solvedAt).getTime()) / (1000 * 60 * 60 * 24);
    return days <= 30;
  }).length;

  const ratingData = useMemo(() => {
    const buckets: Record<string, number> = {};
    solvedProblems.forEach((p) => {
      if (p.rating) {
        const bucket = `${Math.floor(p.rating / 100) * 100}`;
        buckets[bucket] = (buckets[bucket] || 0) + 1;
      }
    });
    return Object.entries(buckets)
      .map(([rating, count]) => ({ rating, count }))
      .sort((a, b) => parseInt(a.rating) - parseInt(b.rating));
  }, [solvedProblems]);

  const topicData = useMemo(() => {
    const topics: Record<string, number> = {};
    solvedProblems.forEach((p) => {
      p.tags.forEach((t) => {
        topics[t] = (topics[t] || 0) + 1;
      });
    });
    return Object.entries(topics)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [solvedProblems]);

  const weakTopics = useMemo(() => {
    const topicMistakes: Record<string, number> = {};
    mistakes.forEach((m) => {
      const problem = problems.find((p) => p.id === m.problemId);
      problem?.tags.forEach((t) => {
        topicMistakes[t] = (topicMistakes[t] || 0) + 1;
      });
    });
    return Object.entries(topicMistakes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([topic]) => topic);
  }, [mistakes, problems]);

  const avgSolveTime = useMemo(() => {
    const times = solvedProblems.filter((p) => p.solveTimeMinutes).map((p) => p.solveTimeMinutes!);
    return times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  }, [solvedProblems]);

  const hintUsage = useMemo(() => {
    const withHint = solvedProblems.filter((p) => p.hintUsed).length;
    const withEditorial = solvedProblems.filter((p) => p.editorialUsed).length;
    const solo = solvedProblems.filter((p) => p.solvedSolo && !p.hintUsed && !p.editorialUsed).length;
    return [
      { name: 'Solo', value: solo },
      { name: 'Hint', value: withHint },
      { name: 'Editorial', value: withEditorial },
    ];
  }, [solvedProblems]);

  const recentSolved = [...solvedProblems]
    .filter((p) => p.solvedAt)
    .sort((a, b) => new Date(b.solvedAt!).getTime() - new Date(a.solvedAt!).getTime())
    .slice(0, 5);

  return (
    <AppLayout
      title="Dashboard"
      description="Your competitive programming command center"
      reviewCount={dueReviews.length}
    >
      <div className="space-y-8">
        {/* Stats Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Current Rating"
            value={settings?.currentRating ?? '—'}
            subtitle={`Target: ${settings?.targetRating ?? '—'}`}
            icon={Target}
            trend={
              lastContestChange !== 0
                ? { value: lastContestChange, label: 'last contest' }
                : undefined
            }
            delay={0}
          />
          <StatCard
            title="Practice Streak"
            value={`${settings?.practiceStreak ?? 0} days`}
            subtitle="Keep it going!"
            icon={Flame}
            delay={0.05}
          />
          <StatCard
            title="Weekly Progress"
            value={`${weeklySolved}/${settings?.weeklyGoal ?? 15}`}
            subtitle="Problems solved"
            icon={CheckCircle2}
            delay={0.1}
          />
          <StatCard
            title="Review Queue"
            value={dueReviews.length}
            subtitle="Due for review"
            icon={RotateCcw}
            delay={0.15}
          />
        </div>

        {/* Progress + Tasks */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm">Progress to Goal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-3xl font-bold">{settings?.currentRating}</span>
                  <span className="text-muted-foreground"> / {settings?.targetRating}</span>
                </div>
                <Badge variant="default">{progressPercent}%</Badge>
              </div>
              <Progress value={progressPercent} />
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Weekly</p>
                  <p className="text-lg font-semibold">
                    {weeklySolved}/{settings?.weeklyGoal}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Monthly</p>
                  <p className="text-lg font-semibold">
                    {monthlySolved}/{settings?.monthlyGoal}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Today&apos;s Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {todayTasks.length === 0 && (
                  <p className="text-sm text-muted-foreground px-1">No tasks scheduled for today.</p>
                )}
                {todayTasks.map((task, i) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/30 px-4 py-3"
                  >
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        task.type === 'solve' && 'bg-cf-header',
                        task.type === 'review' && 'bg-cf-link',
                        task.type === 'weak_topic' && 'bg-cf-orange',
                        task.type === 'contest' && 'bg-[#008000]',
                      )}
                    />
                    <span className="text-sm flex-1">{task.description}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {task.type.replace('_', ' ')}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Problems by Rating">
            <ProblemsByRatingChart data={ratingData} />
          </ChartCard>
          <ChartCard title="Problems by Topic">
            <ProblemsByTopicChart data={topicData} />
          </ChartCard>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Learning Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <LearningHeatmap problems={problems} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Weak Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {weakTopics.length > 0 ? (
                  weakTopics.map((topic) => (
                    <div
                      key={topic}
                      className="flex items-center justify-between rounded-lg bg-destructive/10 px-3 py-2"
                    >
                      <span className="text-sm">{topic}</span>
                      <Badge variant="destructive">Practice</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No weak topics identified yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Solve Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Avg Solve Time</span>
                <span className="ml-auto font-semibold">{avgSolveTime} min</span>
              </div>
              <UsageDonutChart data={hintUsage} />
            </CardContent>
          </Card>
        </div>

        {/* Recent Problems */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Solved Problems</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentSolved.length === 0 && (
                <p className="text-sm text-muted-foreground">No solved problems yet. Use the sidebar on Codeforces to track problems.</p>
              )}
              {recentSolved.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 rounded-lg border border-border/50 px-4 py-3 hover:bg-accent/20 transition-colors"
                >
                  <Badge
                    variant="rating"
                    className={cn(getRatingBg(p.rating), getRatingColor(p.rating))}
                  >
                    {p.rating ?? '?'}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.contestId}
                      {p.problemIndex} · {p.technique}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {p.solvedAt ? format(new Date(p.solvedAt), 'MMM d') : ''}
                  </span>
                  {p.status === 'mastered' && <Badge variant="success">Mastered</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
