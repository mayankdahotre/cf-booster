import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRouter } from './App';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { seedDatabase } from '@/db/seed';
import { migrateChromeStorageProblems } from '@/services/migrate';
import { syncCodeforcesAccount } from '@/services/codeforcesSync';
import { ensureAllTasks } from '@/services/dailyTasksService';
import { db } from '@/db';
import { useSettingsStore, useAppStore } from '@/store';
import '@/styles/globals.css';

const SYNC_STALE_MS = 6 * 60 * 60 * 1000;

function AppInitializer({ children }: { children: React.ReactNode }) {
  const setSettings = useSettingsStore((s) => s.setSettings);
  const setInitialized = useAppStore((s) => s.setInitialized);

  useEffect(() => {
    async function init() {
      try {
        await seedDatabase();
        await migrateChromeStorageProblems();

        let settings = await db.settings.get('default');
        if (settings?.handle) {
          const neverSynced = !settings.lastCodeforcesSync;
          const stale =
            settings.lastCodeforcesSync &&
            Date.now() - new Date(settings.lastCodeforcesSync).getTime() > SYNC_STALE_MS;

          if (neverSynced || stale) {
            try {
              await syncCodeforcesAccount(settings.handle, { clearDemo: neverSynced });
              settings = await db.settings.get('default');
            } catch (error) {
              console.warn('[CF Booster] Auto-sync failed:', error);
            }
          }
        }

        if (settings) {
          setSettings(settings);
          await ensureAllTasks(settings);
        }
      } catch (error) {
        console.error('[CF Booster] Failed to initialize database:', error);
      } finally {
        setInitialized(true);
      }
    }
    init();
  }, [setSettings, setInitialized]);

  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppInitializer>
        <AppRouter />
      </AppInitializer>
    </ErrorBoundary>
  </StrictMode>,
);
