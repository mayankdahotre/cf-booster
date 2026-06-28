import { formatISO, startOfWeek, endOfWeek, format } from 'date-fns';
import { db, generateId } from '@/db';
import type { DailyTask, Problem, UserSettings } from '@/types';

export function todayDateString(): string {
  return formatISO(new Date(), { representation: 'date' });
}

export function weekStartDateString(date = new Date()): string {
  return formatISO(startOfWeek(date, { weekStartsOn: 1 }), { representation: 'date' });
}

export function weekLabel(weekStart: string): string {
  const start = new Date(weekStart);
  const end = endOfWeek(start, { weekStartsOn: 1 });
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`;
}

function pickWeakTopic(problems: Problem[], mistakes: { problemId: string }[]): string | undefined {
  const topicMistakes: Record<string, number> = {};
  mistakes.forEach((m) => {
    const problem = problems.find((p) => p.id === m.problemId);
    problem?.tags.forEach((t) => {
      topicMistakes[t] = (topicMistakes[t] || 0) + 1;
    });
  });

  const topMistakeTopic = Object.entries(topicMistakes).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (topMistakeTopic) return topMistakeTopic;

  const tagCounts: Record<string, number> = {};
  problems.forEach((p) => {
    p.tags.forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  return Object.entries(tagCounts).sort((a, b) => a[1] - b[1])[0]?.[0];
}

function countSolvedInDays(problems: Problem[], days: number): number {
  return problems.filter((p) => {
    if (!p.solvedAt || p.status === 'not_solved') return false;
    const elapsed = (Date.now() - new Date(p.solvedAt).getTime()) / (1000 * 60 * 60 * 24);
    return elapsed <= days;
  }).length;
}

function countContestsThisWeek(contests: { date: string }[]): number {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  return contests.filter((c) => {
    const d = new Date(c.date);
    return d >= weekStart && d <= weekEnd;
  }).length;
}

/** Create today's daily plan if none exists */
export async function ensureTodayTasks(settings?: UserSettings): Promise<void> {
  const today = todayDateString();
  const count = await db.dailyTasks
    .filter((t) => t.date === today && (t.period === 'daily' || !t.period))
    .count();
  if (count > 0) return;

  const s = settings ?? (await db.settings.get('default'));
  if (!s) return;

  const problems = await db.problems.toArray();
  await generateDailyTasks(s, problems);
}

/** Create this week's plan if none exists */
export async function ensureWeekTasks(settings?: UserSettings): Promise<void> {
  const weekStart = weekStartDateString();
  const count = await db.dailyTasks
    .filter((t) => t.date === weekStart && t.period === 'weekly')
    .count();
  if (count > 0) return;

  const s = settings ?? (await db.settings.get('default'));
  if (!s) return;

  const problems = await db.problems.toArray();
  await generateWeeklyTasks(s, problems);
}

/** Ensure both daily and weekly task plans exist */
export async function ensureAllTasks(settings?: UserSettings): Promise<void> {
  const s = settings ?? (await db.settings.get('default'));
  await ensureTodayTasks(s ?? undefined);
  await ensureWeekTasks(s ?? undefined);
}

/** Build today's plan from rating, reviews, and weak topics */
export async function generateDailyTasks(
  settings: UserSettings,
  problems: Problem[],
  options: { replaceAuto?: boolean } = { replaceAuto: true },
): Promise<number> {
  const today = todayDateString();

  if (options.replaceAuto) {
    const todayTasks = await db.dailyTasks
      .filter((t) => t.date === today && (t.period === 'daily' || !t.period))
      .toArray();
    const autoIds = todayTasks.filter((t) => t.source !== 'manual').map((t) => t.id);
    if (autoIds.length) await db.dailyTasks.bulkDelete(autoIds);
  }

  const tasks: DailyTask[] = [];
  const target = settings.currentRating || 1200;

  tasks.push({
    id: generateId(),
    type: 'solve',
    description: `Solve 1 × ${target} rated problem on Codeforces`,
    completed: false,
    targetRating: target,
    count: 1,
    period: 'daily',
    date: today,
    source: 'auto',
  });

  tasks.push({
    id: generateId(),
    type: 'solve',
    description: `Solve 1 × ${target + 100} rated problem on Codeforces`,
    completed: false,
    targetRating: target + 100,
    count: 1,
    period: 'daily',
    date: today,
    source: 'auto',
  });

  const reviewCount = await db.reviews.filter((r) => !r.skipped).count();
  if (reviewCount > 0) {
    tasks.push({
      id: generateId(),
      type: 'review',
      description: `Review ${Math.min(reviewCount, 3)} problems from queue`,
      completed: false,
      count: Math.min(reviewCount, 3),
      period: 'daily',
      date: today,
      source: 'auto',
    });
  }

  const mistakes = await db.mistakes.toArray();
  const weakTopic = pickWeakTopic(problems, mistakes);
  if (weakTopic) {
    tasks.push({
      id: generateId(),
      type: 'weak_topic',
      description: `Practice 1 ${weakTopic} problem`,
      completed: false,
      topic: weakTopic,
      period: 'daily',
      date: today,
      source: 'auto',
    });
  }

  if (tasks.length) await db.dailyTasks.bulkAdd(tasks);
  return tasks.length;
}

/** Build this week's plan from goals, contests, and mistakes */
export async function generateWeeklyTasks(
  settings: UserSettings,
  problems: Problem[],
  options: { replaceAuto?: boolean } = { replaceAuto: true },
): Promise<number> {
  const weekStart = weekStartDateString();

  if (options.replaceAuto) {
    const weekTasks = await db.dailyTasks
      .filter((t) => t.date === weekStart && t.period === 'weekly')
      .toArray();
    const autoIds = weekTasks.filter((t) => t.source !== 'manual').map((t) => t.id);
    if (autoIds.length) await db.dailyTasks.bulkDelete(autoIds);
  }

  const tasks: DailyTask[] = [];
  const weeklyGoal = settings.weeklyGoal || 15;
  const monthlyGoal = settings.monthlyGoal || 50;
  const weekSolved = countSolvedInDays(problems, 7);
  const monthSolved = countSolvedInDays(problems, 30);
  const remainingWeekly = Math.max(0, weeklyGoal - weekSolved);

  if (remainingWeekly > 0) {
    tasks.push({
      id: generateId(),
      type: 'solve',
      description: `Solve ${remainingWeekly} more problems this week (${weekSolved}/${weeklyGoal} done)`,
      completed: false,
      count: remainingWeekly,
      period: 'weekly',
      date: weekStart,
      source: 'auto',
    });
  } else {
    tasks.push({
      id: generateId(),
      type: 'solve',
      description: `Weekly goal reached: ${weekSolved}/${weeklyGoal} problems`,
      completed: true,
      count: weeklyGoal,
      period: 'weekly',
      date: weekStart,
      source: 'auto',
    });
  }

  const contests = await db.contests.toArray();
  const contestsThisWeek = countContestsThisWeek(contests);
  if (contestsThisWeek === 0) {
    tasks.push({
      id: generateId(),
      type: 'contest',
      description: 'Participate in at least 1 Codeforces contest this week',
      completed: false,
      count: 1,
      period: 'weekly',
      date: weekStart,
      source: 'auto',
    });
  }

  const mistakes = await db.mistakes.toArray();
  if (mistakes.length > 0) {
    tasks.push({
      id: generateId(),
      type: 'review',
      description: `Revisit ${Math.min(mistakes.length, 5)} mistakes from your mistake log`,
      completed: false,
      count: Math.min(mistakes.length, 5),
      period: 'weekly',
      date: weekStart,
      source: 'auto',
    });
  }

  const weakTopic = pickWeakTopic(problems, mistakes);
  if (weakTopic) {
    tasks.push({
      id: generateId(),
      type: 'weak_topic',
      description: `Solve 3 ${weakTopic} problems this week`,
      completed: false,
      topic: weakTopic,
      count: 3,
      period: 'weekly',
      date: weekStart,
      source: 'auto',
    });
  }

  const remainingMonthly = Math.max(0, monthlyGoal - monthSolved);
  if (remainingMonthly > 0 && monthSolved < monthlyGoal) {
    tasks.push({
      id: generateId(),
      type: 'solve',
      description: `Monthly progress: ${monthSolved}/${monthlyGoal} — ${remainingMonthly} left this month`,
      completed: false,
      count: remainingMonthly,
      period: 'weekly',
      date: weekStart,
      source: 'auto',
    });
  }

  const target = settings.currentRating || 1200;
  tasks.push({
    id: generateId(),
    type: 'solve',
    description: `Upsolve 2 problems rated ${target}+ from past contests`,
    completed: false,
    targetRating: target,
    count: 2,
    period: 'weekly',
    date: weekStart,
    source: 'auto',
  });

  if (tasks.length) await db.dailyTasks.bulkAdd(tasks);
  return tasks.length;
}

export async function toggleTaskComplete(taskId: string): Promise<void> {
  const task = await db.dailyTasks.get(taskId);
  if (!task) return;
  await db.dailyTasks.update(taskId, { completed: !task.completed });
}

export async function addManualTask(input: {
  description: string;
  type: DailyTask['type'];
  period: 'daily' | 'weekly';
  targetRating?: number;
  count?: number;
  topic?: string;
}): Promise<DailyTask> {
  const date = input.period === 'weekly' ? weekStartDateString() : todayDateString();
  const task: DailyTask = {
    id: generateId(),
    type: input.type,
    description: input.description.trim(),
    completed: false,
    targetRating: input.targetRating,
    count: input.count,
    topic: input.topic,
    period: input.period,
    date,
    source: 'manual',
  };
  await db.dailyTasks.add(task);
  return task;
}

export async function deleteTask(taskId: string): Promise<void> {
  await db.dailyTasks.delete(taskId);
}

export function taskTypeColor(type: DailyTask['type']): string {
  switch (type) {
    case 'solve':
      return 'bg-cf-header';
    case 'review':
      return 'bg-cf-link';
    case 'weak_topic':
      return 'bg-cf-orange';
    case 'contest':
      return 'bg-[#008000]';
    default:
      return 'bg-muted-foreground';
  }
}

export function isDailyTask(task: DailyTask): boolean {
  return task.period === 'daily' || !task.period;
}

export function isWeeklyTask(task: DailyTask): boolean {
  return task.period === 'weekly';
}
