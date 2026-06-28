import Dexie, { type Table } from 'dexie';
import type {
  Problem,
  Pattern,
  Mistake,
  Review,
  Contest,
  UserSettings,
  AnalyticsSnapshot,
  DailyTask,
} from '@/types';

export class CFBoosterDB extends Dexie {
  problems!: Table<Problem, string>;
  patterns!: Table<Pattern, string>;
  mistakes!: Table<Mistake, string>;
  reviews!: Table<Review, string>;
  contests!: Table<Contest, string>;
  settings!: Table<UserSettings, string>;
  analytics!: Table<AnalyticsSnapshot, string>;
  dailyTasks!: Table<DailyTask, string>;

  constructor() {
    super('CFBoosterDB');

    this.version(1).stores({
      problems:
        'id, contestId, problemIndex, name, rating, status, solvedAt, reviewDueDate, *tags, technique, observation, recognitionTrigger',
      patterns: 'id, category, name, *relatedPatterns',
      mistakes: 'id, problemId, problemName, rating, reviewDate, technique',
      reviews: 'id, problemId, stage, dueDate, skipped',
      contests: 'id, contestId, name, date, ratingChange',
      settings: 'id',
      analytics: 'id, date',
      dailyTasks: 'id, type, date, completed',
    });
  }
}

export const db = new CFBoosterDB();

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function problemId(contestId: number, problemIndex: string): string {
  return `${contestId}${problemIndex}`;
}
