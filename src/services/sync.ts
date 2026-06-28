import type { SyncAdapter } from '@/types';
import { db } from '@/db';

/**
 * Placeholder sync adapter for future cloud sync.
 */
export class LocalSyncAdapter implements SyncAdapter {
  async push(): Promise<void> {
    // Future: upload to cloud
    console.info('[CF Booster] Cloud sync not yet implemented');
  }

  async pull(): Promise<void> {
    console.info('[CF Booster] Cloud sync not yet implemented');
  }

  async getLastSyncTime(): Promise<string | null> {
    const settings = await db.settings.get('default');
    return settings?.updatedAt ?? null;
  }
}

export const syncAdapter = new LocalSyncAdapter();
