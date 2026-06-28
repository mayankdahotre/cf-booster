import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LearningHeatmap } from '@/components/charts/LearningHeatmap';
import {
  ChartCard,
  ProblemsByRatingChart,
  ProblemsByTopicChart,
  LearningCurveChart,
  UsageDonutChart,
} from '@/components/charts';
import { db } from '@/db';
import { Clock, Target, Lightbulb, BookOpen } from 'lucide-react';

export default function AnalyticsPage() {
  const problems = useLiveQuery(() => db.problems.toArray(), []) ?? [];
  const mistakes = useLiveQuery(() => db.mistakes.toArray(), []) ?? [];
  const contests = useLiveQuery(() => db.contests.toArray(), []) ?? [];

  const solved = problems.filter((p) => p.status !== 'not_solved');

  const ratingData = useMemo(() => {
    const buckets: Record<string, number> = {};
    solved.forEach((p) => {
      if (p.rating) {
        const bucket = `${Math.floor(p.rating / 100) * 100}`;
        buckets[bucket] = (buckets[bucket] || 0) + 1;
      }
    });
    return Object.entries(buckets)
      .map(([rating, count]) => ({ rating, count }))
      .sort((a, b) => parseInt(a.rating) - parseInt(b.rating));
  }, [solved]);

  const topicData = useMemo(() => {
    const topics: Record<string, number> = {};
    solved.forEach((p) => {
      p.tags.forEach((t) => {
        topics[t] = (topics[t] || 0) + 1;
      });
    });
    return Object.entries(topics)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [solved]);

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
      .slice(0, 5);
  }, [mistakes, problems]);

  const strongTopics = useMemo(() => {
    const topicSolved: Record<string, number> = {};
    solved
      .filter((p) => p.status === 'mastered')
      .forEach((p) => {
        p.tags.forEach((t) => {
          topicSolved[t] = (topicSolved[t] || 0) + 1;
        });
      });
    return Object.entries(topicSolved)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [solved]);

  const avgSolveTime = useMemo(() => {
    const times = solved.filter((p) => p.solveTimeMinutes).map((p) => p.solveTimeMinutes!);
    return times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  }, [solved]);

  const acceptanceRate = useMemo(() => {
    const total = problems.length;
    const accepted = solved.length;
    return total ? Math.round((accepted / total) * 100) : 0;
  }, [problems, solved]);

  const hintUsage = useMemo(() => {
    const withHint = solved.filter((p) => p.hintUsed).length;
    const withEditorial = solved.filter((p) => p.editorialUsed).length;
    const solo = solved.filter((p) => !p.hintUsed && !p.editorialUsed).length;
    return [
      { name: 'Solo', value: solo },
      { name: 'With Hint', value: withHint },
      { name: 'With Editorial', value: withEditorial },
    ];
  }, [solved]);

  const learningCurve = useMemo(() => {
    let rating = 1400;
    return contests
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((c) => {
        rating += c.ratingChange;
        return {
          date: new Date(c.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
          rating,
        };
      });
  }, [contests]);

  const commonMistakes = useMemo(() => {
    return mistakes.map((m) => m.lessonLearned).slice(0, 5);
  }, [mistakes]);

  return (
    <AppLayout title="Analytics" description="Deep insights into your progress">
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Solved" value={solved.length} icon={Target} />
          <StatCard title="Avg Solve Time" value={`${avgSolveTime} min`} icon={Clock} />
          <StatCard title="Acceptance Rate" value={`${acceptanceRate}%`} icon={BookOpen} />
          <StatCard
            title="Hint Usage"
            value={`${solved.filter((p) => p.hintUsed).length}`}
            subtitle="problems with hints"
            icon={Lightbulb}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Problems by Rating">
            <ProblemsByRatingChart data={ratingData} />
          </ChartCard>
          <ChartCard title="Problems by Topic">
            <ProblemsByTopicChart data={topicData} />
          </ChartCard>
        </div>

        {learningCurve.length > 0 && (
          <ChartCard title="Learning Curve (Rating over Contests)">
            <LearningCurveChart data={learningCurve} />
          </ChartCard>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-sm">Weak Topics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {weakTopics.map(([topic, count]) => (
                <div key={topic} className="flex items-center justify-between">
                  <span className="text-sm">{topic}</span>
                  <Badge variant="destructive">{count} mistakes</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-sm">Strong Topics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {strongTopics.map(([topic, count]) => (
                <div key={topic} className="flex items-center justify-between">
                  <span className="text-sm">{topic}</span>
                  <Badge variant="success">{count} mastered</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-sm">Hint & Editorial Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <UsageDonutChart data={hintUsage} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-sm">Practice Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <LearningHeatmap problems={problems} weeks={16} />
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-sm">Most Common Mistakes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {commonMistakes.map((lesson, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/20 text-xs font-bold text-destructive">
                      {i + 1}
                    </span>
                    {lesson}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
