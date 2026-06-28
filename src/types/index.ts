export type ProblemStatus = 'not_solved' | 'solved' | 'mastered';

export type ReviewStage = 'tomorrow' | '1_week' | '1_month' | '3_months';

export type PatternCategory =
  | 'Greedy'
  | 'Prefix Sum'
  | 'Sliding Window'
  | 'Two Pointers'
  | 'Binary Search'
  | 'Bit Manipulation'
  | 'DP'
  | 'Graph'
  | 'Trees'
  | 'Math'
  | 'Constructive'
  | 'Strings';

export interface Problem {
  id: string;
  contestId: number;
  problemIndex: string;
  name: string;
  rating?: number;
  tags: string[];
  status: ProblemStatus;
  observation?: string;
  recognitionTrigger?: string;
  technique?: string;
  mistake?: string;
  personalNotes?: string;
  hintUsed: boolean;
  editorialUsed: boolean;
  solvedSolo: boolean;
  difficulty?: number;
  missingObservation?: string;
  solveTimeMinutes?: number;
  solvedAt?: string;
  masteredAt?: string;
  reviewStatus?: ReviewStage;
  reviewDueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pattern {
  id: string;
  category: PatternCategory;
  name: string;
  recognitionTrigger: string;
  observation: string;
  technique: string;
  complexity: string;
  mistakesToAvoid: string[];
  exampleProblems: string[];
  relatedPatterns: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Mistake {
  id: string;
  problemId: string;
  problemName: string;
  rating?: number;
  whatIThought: string;
  missingObservation: string;
  correctObservation: string;
  technique: string;
  lessonLearned: string;
  reviewDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  problemId: string;
  stage: ReviewStage;
  dueDate: string;
  skipped: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Contest {
  id: string;
  name: string;
  contestId: number;
  rank: number;
  solvedProblems: number;
  penalty: number;
  ratingChange: number;
  problemsMissed: string[];
  patternsLearned: string[];
  mistakesMade: string[];
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  id: string;
  darkMode: boolean;
  targetRating: number;
  currentRating: number;
  weeklyGoal: number;
  monthlyGoal: number;
  practiceStreak: number;
  lastPracticeDate?: string;
  notificationsEnabled: boolean;
  reviewSchedule: ReviewStage[];
  keyboardShortcuts: Record<string, string>;
  username?: string;
  handle?: string;
  avatarUrl?: string;
  lastCodeforcesSync?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsSnapshot {
  id: string;
  date: string;
  problemsByRating: Record<string, number>;
  problemsByTopic: Record<string, number>;
  weakTopics: string[];
  strongTopics: string[];
  averageSolveTime: number;
  acceptanceRate: number;
  hintUsageRate: number;
  editorialUsageRate: number;
  commonMistakes: string[];
  createdAt: string;
}

export interface DailyTask {
  id: string;
  type: 'solve' | 'review' | 'weak_topic' | 'contest';
  description: string;
  completed: boolean;
  targetRating?: number;
  count?: number;
  topic?: string;
  date: string;
}

export interface HeatmapEntry {
  date: string;
  count: number;
}

export interface CodeforcesProblemMeta {
  contestId: number;
  problemIndex: string;
  name: string;
  rating?: number;
  tags: string[];
  url: string;
}

export interface SubmissionEvent {
  problemId: string;
  contestId: number;
  problemIndex: string;
  problemName: string;
  rating?: number;
  tags: string[];
  acceptedAt: string;
}

/** Future AI integration interfaces */
export interface AIProvider {
  generatePatternSummary(patternId: string): Promise<string>;
  recommendSimilarProblems(problemId: string): Promise<string[]>;
  clusterMistakes(): Promise<Record<string, string[]>>;
  generateWeeklyReport(): Promise<string>;
  suggestDailyPlan(): Promise<DailyTask[]>;
}

export interface SyncAdapter {
  push(): Promise<void>;
  pull(): Promise<void>;
  getLastSyncTime(): Promise<string | null>;
}

export type SearchResultType =
  | 'problem'
  | 'technique'
  | 'observation'
  | 'recognition'
  | 'contest'
  | 'tag'
  | 'pattern'
  | 'mistake';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  href: string;
}
