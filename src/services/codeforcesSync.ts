import { db, problemId } from '@/db';
import type { Problem, Contest, UserSettings } from '@/types';
import {
  fetchCodeforcesUser,
  fetchAllSubmissions,
  fetchUserRatingHistory,
  displayNameFromUser,
  type CfSubmission,
} from '@/services/codeforcesApi';
import { generateDailyTasks, generateWeeklyTasks } from '@/services/dailyTasksService';
import { formatISO, subDays, format } from 'date-fns';
import { unixSecondsToIso } from '@/utils';

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
    if (s.verdict !== 'OK') return;
    if (Number.isFinite(s.creationTimeSeconds)) {
      const d = new Date(s.creationTimeSeconds * 1000);
      if (!Number.isNaN(d.getTime())) {
        solvedDates.add(format(d, 'yyyy-MM-dd'));
      }
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
    const solvedAt = unixSecondsToIso(sub.creationTimeSeconds, now);

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
    .filter((r) => (r.newRating - r.oldRating) !== 0 || r.rank > 0)
    .map((r) => ({
      id: `cf-contest-${r.contestId}`,
      name: r.contestName,
      contestId: r.contestId,
      rank: r.rank,
      solvedProblems: countSolvedInContest(submissions, r.contestId),
      penalty: 0,
      ratingChange: r.newRating - r.oldRating,
      problemsMissed: [],
      patternsLearned: [],
      mistakesMade: [],
      date: unixSecondsToIso(r.ratingUpdateTimeSeconds, now),
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
  await generateWeeklyTasks(updatedSettings, problems);

  return {
    problemsSynced: problems.length,
    contestsSynced: contests.length,
    currentRating: user.rating ?? 0,
    maxRating: user.maxRating ?? user.rating ?? 0,
    practiceStreak: streak,
  };
}
