import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { ExternalLink, SkipForward, CheckCircle, RotateCcw } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { db } from '@/db';
import { advanceReviewStage, markProblemMastered } from '@/services/problemService';
import { cn, getRatingColor, getRatingBg } from '@/utils';
import { isReviewDue } from '@/utils/reviews';
import { format, parseISO } from 'date-fns';

const STAGE_LABELS: Record<string, string> = {
  tomorrow: 'Tomorrow',
  '1_week': '1 Week',
  '1_month': '1 Month',
  '3_months': '3 Months',
};

export default function ReviewPage() {
  const reviews = useLiveQuery(() => db.reviews.toArray(), []) ?? [];
  const problems = useLiveQuery(() => db.problems.toArray(), []) ?? [];

  const activeReviews = reviews
    .filter((r) => !r.skipped)
    .map((r) => ({
      ...r,
      problem: problems.find((p) => p.id === r.problemId),
    }))
    .filter((r) => r.problem)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const dueToday = activeReviews.filter((r) => isReviewDue(r.dueDate));

  const upcoming = activeReviews.filter((r) => !isReviewDue(r.dueDate));

  const handleSolveAgain = (contestId: number, problemIndex: string) => {
    window.open(
      `https://codeforces.com/problemset/problem/${contestId}/${problemIndex}`,
      '_blank',
    );
  };

  const handleSkip = async (reviewId: string) => {
    await db.reviews.update(reviewId, { skipped: true, updatedAt: new Date().toISOString() });
  };

  const handleMastered = async (problemId: string, reviewId: string) => {
    await markProblemMastered(problemId);
    await db.reviews.delete(reviewId);
  };

  const handleAdvance = async (reviewId: string) => {
    await advanceReviewStage(reviewId);
  };

  return (
    <AppLayout
      title="Review Queue"
      description="Spaced repetition for lasting mastery"
      reviewCount={dueToday.length}
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            Due Today
            <Badge variant="destructive">{dueToday.length}</Badge>
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {dueToday.map((review, i) => (
              <ReviewCard
                key={review.id}
                review={review}
                index={i}
                onSolveAgain={() =>
                  handleSolveAgain(review.problem!.contestId, review.problem!.problemIndex)
                }
                onSkip={() => handleSkip(review.id)}
                onMastered={() => handleMastered(review.problemId, review.id)}
                onAdvance={() => handleAdvance(review.id)}
              />
            ))}
            {dueToday.length === 0 && (
              <p className="text-muted-foreground col-span-2">All caught up for today!</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Upcoming</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((review, i) => (
              <ReviewCard
                key={review.id}
                review={review}
                index={i}
                onSolveAgain={() =>
                  handleSolveAgain(review.problem!.contestId, review.problem!.problemIndex)
                }
                onSkip={() => handleSkip(review.id)}
                onMastered={() => handleMastered(review.problemId, review.id)}
                onAdvance={() => handleAdvance(review.id)}
              />
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function ReviewCard({
  review,
  index,
  onSolveAgain,
  onSkip,
  onMastered,
  onAdvance,
}: {
  review: {
    id: string;
    stage: string;
    dueDate: string;
    problem?: {
      name: string;
      contestId: number;
      problemIndex: string;
      rating?: number;
      technique?: string;
      tags: string[];
    };
  };
  index: number;
  onSolveAgain: () => void;
  onSkip: () => void;
  onMastered: () => void;
  onAdvance: () => void;
}) {
  const p = review.problem!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{p.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {p.contestId}
                {p.problemIndex}
              </p>
            </div>
            <Badge
              variant="rating"
              className={cn(getRatingBg(p.rating), getRatingColor(p.rating))}
            >
              {p.rating ?? '?'}
            </Badge>
          </div>

          {p.technique && (
            <p className="text-sm text-muted-foreground">{p.technique}</p>
          )}

          <div className="flex items-center gap-2">
            <Badge variant="outline">{STAGE_LABELS[review.stage] ?? review.stage}</Badge>
            <span className="text-xs text-muted-foreground">
              Due {format(parseISO(review.dueDate), 'MMM d')}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={onSolveAgain} className="gap-1">
              <ExternalLink className="h-3 w-3" />
              Solve Again
            </Button>
            <Button size="sm" variant="outline" onClick={onAdvance} className="gap-1">
              <RotateCcw className="h-3 w-3" />
              Next Stage
            </Button>
            <Button size="sm" variant="ghost" onClick={onSkip} className="gap-1">
              <SkipForward className="h-3 w-3" />
              Skip
            </Button>
            <Button size="sm" variant="success" onClick={onMastered} className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Mastered
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
