import type { CodeforcesProblemMeta, ReviewStage } from '@/types';

export type CfMessage =
  | { type: 'CF_GET_PROBLEM'; contestId: number; problemIndex: string }
  | {
      type: 'CF_SAVE_PROBLEM';
      meta: CodeforcesProblemMeta;
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
        solveTimeMinutes?: number;
      };
    }
  | { type: 'CF_ADD_REVIEW'; contestId: number; problemIndex: string; stage?: ReviewStage }
  | { type: 'CF_GET_DUE_REVIEW_COUNT' }
  | { type: 'SUBMISSION_ACCEPTED'; problemName: string }
  | { type: 'UPDATE_BADGE'; count: number };

export interface CfMessageResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function sendCfMessage<T = unknown>(
  message: CfMessage,
): Promise<CfMessageResponse<T>> {
  try {
    const response = await chrome.runtime.sendMessage(message);
    return (response as CfMessageResponse<T>) ?? { success: false, error: 'No response' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Extension message failed',
    };
  }
}
