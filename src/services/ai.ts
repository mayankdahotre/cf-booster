import type { AIProvider, DailyTask } from '@/types';

/**
 * Placeholder AI service for future integration.
 * Swap implementation when AI backend is ready.
 */
export class AIService implements AIProvider {
  async generatePatternSummary(_patternId: string): Promise<string> {
    throw new Error('AI not implemented yet');
  }

  async recommendSimilarProblems(_problemId: string): Promise<string[]> {
    throw new Error('AI not implemented yet');
  }

  async clusterMistakes(): Promise<Record<string, string[]>> {
    throw new Error('AI not implemented yet');
  }

  async generateWeeklyReport(): Promise<string> {
    throw new Error('AI not implemented yet');
  }

  async suggestDailyPlan(): Promise<DailyTask[]> {
    throw new Error('AI not implemented yet');
  }
}

export const aiService = new AIService();
