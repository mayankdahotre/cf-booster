import { useEffect, useState } from 'react';
import { ExternalLink, RotateCcw, Flame, Target } from 'lucide-react';
import { db } from '@/db';
import { seedDatabase } from '@/db/seed';
import { cn, getRatingColor } from '@/utils';

export function PopupApp() {
  const [stats, setStats] = useState({
    reviewCount: 0,
    streak: 0,
    rating: 0,
    target: 0,
    todayTasks: 0,
    handle: 'User',
  });

  useEffect(() => {
    async function load() {
      await seedDatabase();
      const [reviews, settings, tasks] = await Promise.all([
        db.reviews.filter((r) => !r.skipped).count(),
        db.settings.get('default'),
        db.dailyTasks.filter((t) => !t.completed).count(),
      ]);
      setStats({
        reviewCount: reviews,
        streak: settings?.practiceStreak ?? 0,
        rating: settings?.currentRating ?? 0,
        target: settings?.targetRating ?? 0,
        todayTasks: tasks,
        handle: settings?.handle ?? settings?.username ?? 'User',
      });
    }
    load();
  }, []);

  const openDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  };

  return (
    <div className="w-[300px] bg-[#e1e1e1] text-foreground font-sans text-[13px]">
      <div className="bg-cf-header text-white px-3 py-2">
        <div className="font-bold text-sm">CF Booster</div>
        <div className={cn('text-xs mt-0.5 font-bold', getRatingColor(stats.rating))}>
          {stats.handle}
          {stats.rating ? ` · ${stats.rating}` : ''}
        </div>
      </div>

      <div className="p-3 grid grid-cols-2 gap-2">
        <div className="cf-roundbox p-2.5 bg-white">
          <div className="flex items-center gap-1 text-muted-foreground text-[11px] mb-0.5">
            <Target className="h-3 w-3" /> Rating
          </div>
          <p className={cn('text-base font-bold', getRatingColor(stats.rating))}>{stats.rating}</p>
          <p className="text-[10px] text-muted-foreground">/ {stats.target}</p>
        </div>
        <div className="cf-roundbox p-2.5 bg-white">
          <div className="flex items-center gap-1 text-muted-foreground text-[11px] mb-0.5">
            <Flame className="h-3 w-3" /> Streak
          </div>
          <p className="text-base font-bold">{stats.streak} days</p>
        </div>
        <div className="cf-roundbox p-2.5 bg-white">
          <div className="flex items-center gap-1 text-muted-foreground text-[11px] mb-0.5">
            <RotateCcw className="h-3 w-3" /> Reviews
          </div>
          <p className="text-base font-bold text-cf-link">{stats.reviewCount}</p>
        </div>
        <div className="cf-roundbox p-2.5 bg-white">
          <div className="text-muted-foreground text-[11px] mb-0.5">Tasks Today</div>
          <p className="text-base font-bold">{stats.todayTasks}</p>
        </div>
      </div>

      <div className="px-3 pb-3">
        <button
          onClick={openDashboard}
          className="w-full flex items-center justify-center gap-2 rounded-[3px] bg-cf-header text-white py-2 text-[13px] font-normal border border-[#1a5f8a] hover:bg-[#1a5f8a]"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open Dashboard
        </button>
      </div>
    </div>
  );
}
