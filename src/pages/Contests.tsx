import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Trophy } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { db } from '@/db';
import { cn } from '@/utils';
import { format } from 'date-fns';

export default function ContestsPage() {
  const contests = useLiveQuery(
    () => db.contests.orderBy('date').reverse().toArray(),
    [],
  ) ?? [];

  return (
    <AppLayout title="Contest History" description="Track your contest performance">
      <div className="space-y-4">
        {contests.map((contest, i) => (
          <motion.div
            key={contest.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="glass hover:border-primary/20 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cf-orange/20">
                      <Trophy className="h-5 w-5 text-cf-orange" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{contest.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(contest.date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {contest.ratingChange >= 0 ? (
                      <Badge variant="success" className="gap-1">
                        <TrendingUp className="h-3 w-3" />+{contest.ratingChange}
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <TrendingDown className="h-3 w-3" />
                        {contest.ratingChange}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Rank</p>
                    <p className="text-lg font-semibold">#{contest.rank.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Solved</p>
                    <p className="text-lg font-semibold">{contest.solvedProblems}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Penalty</p>
                    <p className="text-lg font-semibold">{contest.penalty}</p>
                  </div>
                </div>

                {contest.problemsMissed.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Problems Missed</p>
                    <div className="flex gap-2">
                      {contest.problemsMissed.map((p) => (
                        <Badge key={p} variant="destructive">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {contest.patternsLearned.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Patterns Learned</p>
                    <div className="flex flex-wrap gap-2">
                      {contest.patternsLearned.map((p) => (
                        <Badge key={p} variant="default">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {contest.mistakesMade.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Mistakes Made</p>
                    <ul className="space-y-1">
                      {contest.mistakesMade.map((m) => (
                        <li key={m} className={cn('text-sm text-destructive/80')}>
                          • {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </AppLayout>
  );
}
