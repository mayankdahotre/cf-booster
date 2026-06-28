import { db, generateId } from '@/db';
import type { Pattern, UserSettings } from '@/types';

const now = new Date();
const iso = (d: Date) => d.toISOString();

const defaultPatterns: Pattern[] = [
  {
    id: generateId(),
    category: 'Greedy',
    name: 'Sort and Pair',
    recognitionTrigger: 'Maximize/minimize sum with pairwise operations',
    observation: 'Sorting elements enables optimal pairing',
    technique: 'Sort array, then apply greedy pairing rule',
    complexity: 'O(n log n)',
    mistakesToAvoid: ['Forgetting to sort first', 'Wrong comparator'],
    exampleProblems: [],
    relatedPatterns: ['Two Pointers'],
    createdAt: iso(now),
    updatedAt: iso(now),
  },
  {
    id: generateId(),
    category: 'Binary Search',
    name: 'Binary Search on Answer',
    recognitionTrigger: 'Minimize maximum or maximize minimum',
    observation: 'Answer space is monotonic',
    technique: 'Binary search on answer, check feasibility',
    complexity: 'O(n log(max-min))',
    mistakesToAvoid: ['Non-monotonic check function', 'Wrong bounds'],
    exampleProblems: [],
    relatedPatterns: ['Greedy'],
    createdAt: iso(now),
    updatedAt: iso(now),
  },
  {
    id: generateId(),
    category: 'DP',
    name: 'Alternating Subarray DP',
    recognitionTrigger: 'Subarray with alternating property',
    observation: 'State depends on last element sign',
    technique: 'DP[i][sign] = max ending at i with given sign',
    complexity: 'O(n)',
    mistakesToAvoid: ['Not handling single elements', 'Wrong state transitions'],
    exampleProblems: [],
    relatedPatterns: ['Greedy'],
    createdAt: iso(now),
    updatedAt: iso(now),
  },
  {
    id: generateId(),
    category: 'Sliding Window',
    name: 'Fixed Size Window',
    recognitionTrigger: 'Subarray of fixed length k',
    observation: 'Maintain window sum/count as we slide',
    technique: 'Two pointers with O(1) update per step',
    complexity: 'O(n)',
    mistakesToAvoid: ['Off-by-one in window bounds'],
    exampleProblems: [],
    relatedPatterns: ['Two Pointers', 'Prefix Sum'],
    createdAt: iso(now),
    updatedAt: iso(now),
  },
  {
    id: generateId(),
    category: 'Graph',
    name: 'BFS Shortest Path',
    recognitionTrigger: 'Unweighted graph shortest path',
    observation: 'BFS explores level by level',
    technique: 'BFS from source, track distances',
    complexity: 'O(V + E)',
    mistakesToAvoid: ['Using DFS for unweighted shortest path'],
    exampleProblems: [],
    relatedPatterns: ['Trees'],
    createdAt: iso(now),
    updatedAt: iso(now),
  },
  {
    id: generateId(),
    category: 'Two Pointers',
    name: 'Opposite Ends',
    recognitionTrigger: 'Sorted array pair sum/target',
    observation: 'Move pointers based on comparison with target',
    technique: 'Left and right pointers converging',
    complexity: 'O(n)',
    mistakesToAvoid: ['Not sorting first', 'Skipping duplicates incorrectly'],
    exampleProblems: [],
    relatedPatterns: ['Binary Search'],
    createdAt: iso(now),
    updatedAt: iso(now),
  },
];

/** Seed only default settings and reference patterns — no fake problems or contests */
export async function seedDatabase(): Promise<void> {
  const existingSettings = await db.settings.get('default');
  if (!existingSettings) {
    const settings: UserSettings = {
      id: 'default',
      darkMode: true,
      targetRating: 1800,
      currentRating: 0,
      weeklyGoal: 15,
      monthlyGoal: 50,
      practiceStreak: 0,
      notificationsEnabled: true,
      reviewSchedule: ['tomorrow', '1_week', '1_month', '3_months'],
      keyboardShortcuts: {
        'open-dashboard': 'Alt+Shift+C',
        'open-search': 'Alt+Shift+S',
        'toggle-sidebar': 'Alt+Shift+B',
      },
      createdAt: iso(now),
      updatedAt: iso(now),
    };
    await db.settings.add(settings);
  }

  const patternCount = await db.patterns.count();
  if (patternCount === 0) {
    await db.patterns.bulkAdd(defaultPatterns);
  }
}
