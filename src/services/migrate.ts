import { db, problemId } from '@/db';
import type { Problem } from '@/types';
import {
  upsertProblemFromCF,
  markProblemSolved,
  markProblemMastered,
} from '@/services/problemService';

/** Migrate legacy chrome.storage.local sidebar saves into IndexedDB */
export async function migrateChromeStorageProblems(): Promise<number> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return 0;

  const all = await chrome.storage.local.get(null);
  const now = new Date().toISOString();
  let migrated = 0;

  for (const [key, value] of Object.entries(all)) {
    if (!key.startsWith('cf_problem_') || !value || typeof value !== 'object') continue;

    const data = value as {
      contestId: number;
      problemIndex: string;
      name: string;
      rating?: number;
      tags?: string[];
      status?: string;
      observation?: string;
      recognitionTrigger?: string;
      technique?: string;
      mistake?: string;
      personalNotes?: string;
    };

    if (!data.contestId || !data.problemIndex) continue;

    await upsertProblemFromCF({
      contestId: data.contestId,
      problemIndex: data.problemIndex,
      name: data.name || `Problem ${data.problemIndex}`,
      rating: data.rating,
      tags: data.tags ?? [],
      url: `https://codeforces.com/problemset/problem/${data.contestId}/${data.problemIndex}`,
    });

    const id = problemId(data.contestId, data.problemIndex);
    const updates: Partial<Problem> = {
      observation: data.observation,
      recognitionTrigger: data.recognitionTrigger,
      technique: data.technique,
      mistake: data.mistake,
      personalNotes: data.personalNotes,
      updatedAt: now,
    };

    if (data.status === 'solved') {
      await markProblemSolved(id, updates);
    } else if (data.status === 'mastered') {
      await db.problems.update(id, updates);
      await markProblemMastered(id);
    } else {
      await db.problems.update(id, updates);
    }

    await chrome.storage.local.remove(key);
    migrated++;
  }

  return migrated;
}
