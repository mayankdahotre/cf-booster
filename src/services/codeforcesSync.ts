import { db, generateId, problemId } from '@/db';
import type { Problem, Contest, DailyTask, UserSettings } from '@/types';
import {
  fetchCodeforcesUser,
  fetchAllSubmissions,
  fetchUserRatingHistory,
  displayNameFromUser,
  type CfSubmission,
} from '@/services/codeforcesApi';
import { formatISO, subDays, format } from 'date-fns';

export interface SyncResult {
  problemsSynced: number;
  contestsSynced: number;
  currentRating: number;
  maxRating: number;
  practiceStreak: number;
}

/** Remove demo/seed problems, contests, mistakes, reviews, and tasks */
export async function clearDemoData(): Promise<void> {
  await db.transaction(
    'rw',
    [db.problems, db.mistakes, db.reviews, db.contests, db.dailyTasks],
    async () => {
      await db.problems.clear();
      await db.mistakes.clear();
      await db.reviews.clear();
      await db.contests.clear();
      await db.dailyTasks.clear();
    },
  );
}

function buildSolvedProblemsMap(submissions: CfSubmission[]): Map<string, CfSubmission> {
  const solved = new Map<string, CfSubmission>();

  for (const sub of submissions) {
    if (sub.verdict !== 'OK') continue;
    const cid = sub.problem.contestId;
    const idx = sub.problem.index.toUpperCase();
    const key = problemId(cid, idx);
    const existing = solved.get(key);
    if (!existing || sub.creationTimeSeconds > existing.creationTimeSeconds) {
      solved.set(key, sub);
    }
  }

  return solved;
}

function computeStreak(submissions: CfSubmission[]): number {
  const solvedDates = new Set<string>();
  submissions.forEach((s) => {
    if (s.verdict === 'OK') {
      solvedDates.add(format(new Date(s.creationTimeSeconds * 1000), 'yyyy-MM-dd'));
    }
  });

  let streak = 0;
  let day = new Date();
  while (true) {
    const key = format(day, 'yyyy-MM-dd');
    if (solvedDates.has(key)) {
      streak++;
      day = subDays(day, 1);
    } else {
      break;
    }
  }
  return streak;
}

function countSolvedInContest(submissions: CfSubmission[], contestId: number): number {
  const solved = new Set<string>();
  submissions.forEach((s) => {
    if (s.verdict === 'OK' && s.contestId === contestId) {
      solved.add(s.problem.index.toUpperCase());
    }
  });
  return solved.size;
}

async function generateDailyTasks(settings: UserSettings, problems: Problem[]): Promise<void> {
  const today = formatISO(new Date(), { representation: 'date' });
  await db.dailyTasks.where('date').equals(today).delete();

  const tasks: DailyTask[] = [];
  const target = settings.currentRating || 1200;

  tasks.push({
    id: generateId(),
    type: 'solve',
    description: `Solve 1 × ${target} rated problem on Codeforces`,
    completed: false,
    targetRating: target,
    count: 1,
    date: today,
  });

  tasks.push({
    id: generateId(),
    type: 'solve',
    description: `Solve 1 × ${target + 100} rated problem on Codeforces`,
    completed: false,
    targetRating: target + 100,
    count: 1,
    date: today,
  });

  const reviewCount = await db.reviews.filter((r) => !r.skipped).count();
  if (reviewCount > 0) {
    tasks.push({
      id: generateId(),
      type: 'review',
      description: `Review ${Math.min(reviewCount, 5)} problems from queue`,
      completed: false,
      count: Math.min(reviewCount, 5),
      date: today,
    });
  }

  const tagCounts: Record<string, number> = {};
  problems.forEach((p) => {
    p.tags.forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  const weakTopic = Object.entries(tagCounts).sort((a, b) => a[1] - b[1])[0]?.[0];
  if (weakTopic) {
    tasks.push({
      id: generateId(),
      type: 'weak_topic',
      description: `Practice ${weakTopic} problems`,
      completed: false,
      topic: weakTopic,
      date: today,
    });
  }

  if (tasks.length) await db.dailyTasks.bulkAdd(tasks);
}

export async function syncCodeforcesAccount(
  handle: string,
  options: { clearDemo?: boolean } = { clearDemo: true },
): Promise<SyncResult> {
  const user = await fetchCodeforcesUser(handle);
  const [submissions, ratingHistory] = await Promise.all([
    fetchAllSubmissions(user.handle),
    fetchUserRatingHistory(user.handle),
  ]);

  if (options.clearDemo) {
    await clearDemoData();
  }

  const solvedMap = buildSolvedProblemsMap(submissions);
  const existingProblems = await db.problems.toArray();
  const existingById = new Map(existingProblems.map((p) => [p.id, p]));
  const now = new Date().toISOString();

  const problems: Problem[] = [];
  for (const [id, sub] of solvedMap) {
    const existing = existingById.get(id);
    const p = sub.problem;
    const solvedAt = new Date(sub.creationTimeSeconds * 1000).toISOString();

    problems.push({
      id,
      contestId: p.contestId,
      problemIndex: p.index.toUpperCase(),
      name: p.name,
      rating: p.rating,
      tags: p.tags ?? [],
      status: existing?.status === 'mastered' ? 'mastered' : 'solved',
      observation: existing?.observation,
      recognitionTrigger: existing?.recognitionTrigger,
      technique: existing?.technique,
      mistake: existing?.mistake,
      personalNotes: existing?.personalNotes,
      hintUsed: existing?.hintUsed ?? false,
      editorialUsed: existing?.editorialUsed ?? false,
      solvedSolo: existing?.solvedSolo ?? true,
      difficulty: existing?.difficulty,
      solveTimeMinutes: existing?.solveTimeMinutes,
      solvedAt,
      masteredAt: existing?.masteredAt,
      reviewStatus: existing?.reviewStatus,
      reviewDueDate: existing?.reviewDueDate,
      createdAt: existing?.createdAt ?? solvedAt,
      updatedAt: now,
    });
  }

  if (problems.length) {
    await db.problems.bulkPut(problems);
  }

  const contests: Contest[] = ratingHistory
    .filter((r) => r.ratingUpdate !== 0 || r.rank > 0)
    .map((r) => ({
      id: `cf-contest-${r.contestId}`,
      name: r.contestName,
      contestId: r.contestId,
      rank: r.rank,
      solvedProblems: countSolvedInContest(submissions, r.contestId),
      penalty: 0,
      ratingChange: r.ratingUpdate,
      problemsMissed: [],
      patternsLearned: [],
      mistakesMade: [],
      date: new Date(r.ratingChangeTimeSeconds * 1000).toISOString(),
      createdAt: now,
      updatedAt: now,
    }));

  if (contests.length) {
    await db.contests.bulkPut(contests);
  }

  const streak = computeStreak(submissions);
  const settings = (await db.settings.get('default')) ?? {
    id: 'default',
    darkMode: true,
    targetRating: Math.max((user.rating ?? 1200) + 200, 1500),
    currentRating: user.rating ?? 0,
    weeklyGoal: 15,
    monthlyGoal: 50,
    practiceStreak: 0,
    notificationsEnabled: true,
    reviewSchedule: ['tomorrow', '1_week', '1_month', '3_months'] as UserSettings['reviewSchedule'],
    keyboardShortcuts: {
      'open-dashboard': 'Alt+Shift+C',
      'open-search': 'Alt+Shift+S',
      'toggle-sidebar': 'Alt+Shift+B',
    },
    createdAt: now,
    updatedAt: now,
  };

  const updatedSettings: UserSettings = {
    ...settings,
    handle: user.handle,
    username: displayNameFromUser(user),
    currentRating: user.rating ?? settings.currentRating,
    avatarUrl: user.titlePhoto ?? user.avatar,
    practiceStreak: streak,
    lastPracticeDate: streak > 0 ? formatISO(new Date(), { representation: 'date' }) : settings.lastPracticeDate,
    lastCodeforcesSync: now,
    updatedAt: now,
  };

  await db.settings.put(updatedSettings);
  await generateDailyTasks(updatedSettings, problems);

  return {
    problemsSynced: problems.length,
    contestsSynced: contests.length,
    currentRating: user.rating ?? 0,
    maxRating: user.maxRating ?? user.rating ?? 0,
    practiceStreak: streak,
  };
}
