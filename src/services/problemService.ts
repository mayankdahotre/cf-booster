import { db, generateId, problemId } from '@/db';
import type { Problem, CodeforcesProblemMeta, ReviewStage } from '@/types';
import { addDays, formatISO } from 'date-fns';

const REVIEW_INTERVALS: Record<ReviewStage, number> = {
  tomorrow: 1,
  '1_week': 7,
  '1_month': 30,
  '3_months': 90,
};

export async function upsertProblemFromCF(meta: CodeforcesProblemMeta): Promise<Problem> {
  const id = problemId(meta.contestId, meta.problemIndex);
  const existing = await db.problems.get(id);
  const now = new Date().toISOString();

  if (existing) {
    await db.problems.update(id, {
      name: meta.name,
      rating: meta.rating,
      tags: meta.tags,
      updatedAt: now,
    });
    return (await db.problems.get(id))!;
  }

  const problem: Problem = {
    id,
    contestId: meta.contestId,
    problemIndex: meta.problemIndex,
    name: meta.name,
    rating: meta.rating,
    tags: meta.tags,
    status: 'not_solved',
    hintUsed: false,
    editorialUsed: false,
    solvedSolo: true,
    createdAt: now,
    updatedAt: now,
  };

  await db.problems.add(problem);
  return problem;
}

export async function markProblemSolved(
  id: string,
  data: Partial<Problem>,
): Promise<void> {
  const now = new Date().toISOString();
  await db.problems.update(id, {
    ...data,
    status: 'solved',
    solvedAt: now,
    updatedAt: now,
  });
}

export async function markProblemMastered(id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.problems.update(id, {
    status: 'mastered',
    masteredAt: now,
    updatedAt: now,
  });
  await db.reviews.where('problemId').equals(id).delete();
}

export async function addToReviewQueue(
  problemId: string,
  stage: ReviewStage = 'tomorrow',
): Promise<void> {
  const now = new Date();
  const dueDate = formatISO(addDays(now, REVIEW_INTERVALS[stage]), {
    representation: 'date',
  });

  const existing = await db.reviews.where('problemId').equals(problemId).first();
  if (existing) {
    await db.reviews.update(existing.id, { stage, dueDate, updatedAt: now.toISOString() });
  } else {
    await db.reviews.add({
      id: generateId(),
      problemId,
      stage,
      dueDate,
      skipped: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }

  await db.problems.update(problemId, {
    reviewStatus: stage,
    reviewDueDate: dueDate,
    updatedAt: now.toISOString(),
  });
}

export async function advanceReviewStage(reviewId: string): Promise<void> {
  const review = await db.reviews.get(reviewId);
  if (!review) return;

  const stages: ReviewStage[] = ['tomorrow', '1_week', '1_month', '3_months'];
  const currentIndex = stages.indexOf(review.stage);
  const nextStage = stages[Math.min(currentIndex + 1, stages.length - 1)];

  if (nextStage === review.stage) {
    await db.reviews.update(reviewId, { skipped: true, updatedAt: new Date().toISOString() });
    return;
  }

  await addToReviewQueue(review.problemId, nextStage);
}

export async function exportAllData(): Promise<string> {
  const [problems, patterns, mistakes, reviews, contests, settings, analytics, dailyTasks] =
    await Promise.all([
      db.problems.toArray(),
      db.patterns.toArray(),
      db.mistakes.toArray(),
      db.reviews.toArray(),
      db.contests.toArray(),
      db.settings.toArray(),
      db.analytics.toArray(),
      db.dailyTasks.toArray(),
    ]);

  return JSON.stringify(
    { problems, patterns, mistakes, reviews, contests, settings, analytics, dailyTasks },
    null,
    2,
  );
}

export async function importData(json: string): Promise<void> {
  const data = JSON.parse(json);
  await db.transaction(
    'rw',
    [db.problems, db.patterns, db.mistakes, db.reviews, db.contests, db.settings, db.analytics, db.dailyTasks],
    async () => {
      if (data.problems) await db.problems.bulkPut(data.problems);
      if (data.patterns) await db.patterns.bulkPut(data.patterns);
      if (data.mistakes) await db.mistakes.bulkPut(data.mistakes);
      if (data.reviews) await db.reviews.bulkPut(data.reviews);
      if (data.contests) await db.contests.bulkPut(data.contests);
      if (data.settings) await db.settings.bulkPut(data.settings);
      if (data.analytics) await db.analytics.bulkPut(data.analytics);
      if (data.dailyTasks) await db.dailyTasks.bulkPut(data.dailyTasks);
    },
  );
}

export function exportProblemsCSV(problems: Problem[]): string {
  const headers = [
    'Problem',
    'Contest',
    'Rating',
    'Tags',
    'Date',
    'Technique',
    'Observation',
    'Recognition Trigger',
    'Hint Used',
    'Mastered',
    'Review Status',
  ];

  const rows = problems.map((p) => [
    p.name,
    `${p.contestId}${p.problemIndex}`,
    p.rating ?? '',
    p.tags.join(';'),
    p.solvedAt ?? '',
    p.technique ?? '',
    p.observation ?? '',
    p.recognitionTrigger ?? '',
    p.hintUsed ? 'Yes' : 'No',
    p.status === 'mastered' ? 'Yes' : 'No',
    p.reviewStatus ?? '',
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}
