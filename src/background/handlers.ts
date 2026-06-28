import { db, problemId, generateId } from '@/db';
import type { Problem } from '@/types';
import {
  upsertProblemFromCF,
  markProblemSolved,
  markProblemMastered,
  addToReviewQueue,
} from '@/services/problemService';
import type { CodeforcesProblemMeta } from '@/types';
import { isPast, isToday, parseISO, startOfDay } from 'date-fns';
import type { CfMessage, CfMessageResponse } from '@/messaging/types';

export function isReviewDue(dueDate: string): boolean {  const due = startOfDay(parseISO(dueDate));
  return isToday(due) || isPast(due);
}

export async function getDueReviewCount(): Promise<number> {
  const reviews = await db.reviews.filter((r) => !r.skipped).toArray();
  return reviews.filter((r) => isReviewDue(r.dueDate)).length;
}

export async function updateBadgeCount(): Promise<void> {
  const count = await getDueReviewCount();
  chrome.action.setBadgeBackgroundColor({ color: '#2175a4' });
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
}

async function saveProblemFromSidebar(
  meta: CodeforcesProblemMeta,
  data: {
    status?: string;
    observation?: string;
    recognitionTrigger?: string;
    technique?: string;
    mistake?: string;
    personalNotes?: string;
    hintUsed?: boolean;
    editorialUsed?: boolean;
    solvedSolo?: boolean;
    difficulty?: number;
  },
): Promise<void> {
  await upsertProblemFromCF(meta);
  const id = problemId(meta.contestId, meta.problemIndex);
  const existing = await db.problems.get(id);
  const now = new Date().toISOString();

  const updates: Partial<Problem> = {
    ...(data.observation !== undefined && { observation: data.observation }),
    ...(data.recognitionTrigger !== undefined && { recognitionTrigger: data.recognitionTrigger }),
    ...(data.technique !== undefined && { technique: data.technique }),
    ...(data.mistake !== undefined && { mistake: data.mistake }),
    ...(data.personalNotes !== undefined && { personalNotes: data.personalNotes }),
    ...(data.hintUsed !== undefined && { hintUsed: data.hintUsed }),
    ...(data.editorialUsed !== undefined && { editorialUsed: data.editorialUsed }),
    ...(data.solvedSolo !== undefined && { solvedSolo: data.solvedSolo }),
    ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
    updatedAt: now,
  };

  if (data.status === 'solved') {
    await markProblemSolved(id, { ...updates, status: 'solved' });
  } else if (data.status === 'mastered') {
    await db.problems.update(id, updates);
    await markProblemMastered(id);
  } else if (Object.keys(updates).length > 1) {
    await db.problems.update(id, updates);
  } else if (!existing) {
    // ensure problem row exists after upsert
    await db.problems.update(id, { updatedAt: now });
  }

  if (data.mistake?.trim()) {
    const problem = await db.problems.get(id);
    const existing = await db.mistakes.where('problemId').equals(id).first();
    if (!existing && problem) {
      await db.mistakes.add({
        id: generateId(),
        problemId: id,
        problemName: problem.name,
        rating: problem.rating,
        whatIThought: '',
        missingObservation: data.mistake,
        correctObservation: data.observation ?? '',
        technique: data.technique ?? '',
        lessonLearned: data.mistake,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}

export async function handleCfMessage(message: CfMessage): Promise<CfMessageResponse> {
  try {
    switch (message.type) {
      case 'CF_GET_PROBLEM': {
        const id = problemId(message.contestId, message.problemIndex);
        const problem = await db.problems.get(id);
        return { success: true, data: problem ?? null };
      }

      case 'CF_SAVE_PROBLEM': {
        await saveProblemFromSidebar(message.meta, message.data);
        await updateBadgeCount();
        return { success: true };
      }

      case 'CF_ADD_REVIEW': {
        const id = problemId(message.contestId, message.problemIndex);
        const existing = await db.problems.get(id);
        if (!existing) {
          return { success: false, error: 'Save the problem first before adding to review.' };
        }
        await addToReviewQueue(id, message.stage ?? 'tomorrow');
        await updateBadgeCount();
        return { success: true };
      }

      case 'CF_GET_DUE_REVIEW_COUNT': {
        const count = await getDueReviewCount();
        return { success: true, data: count };
      }

      default:
        return { success: false, error: 'Unknown message type' };
    }
  } catch (error) {
    console.error('[CF Booster] Handler error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

