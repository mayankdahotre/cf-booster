import { useMemo } from 'react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { cn } from '@/utils';
import type { Problem } from '@/types';

interface HeatmapProps {
  problems: Problem[];
  weeks?: number;
}

export function LearningHeatmap({ problems, weeks = 12 }: HeatmapProps) {
  const { days, maxCount } = useMemo(() => {
    const end = new Date();
    const start = subDays(end, weeks * 7);
    const allDays = eachDayOfInterval({ start, end });

    const countByDate: Record<string, number> = {};
    problems.forEach((p) => {
      if (p.solvedAt) {
        const date = format(new Date(p.solvedAt), 'yyyy-MM-dd');
        countByDate[date] = (countByDate[date] || 0) + 1;
      }
    });

    const daysData = allDays.map((d) => {
      const key = format(d, 'yyyy-MM-dd');
      return { date: d, count: countByDate[key] || 0 };
    });

    const max = Math.max(...daysData.map((d) => d.count), 1);
    return { days: daysData, maxCount: max };
  }, [problems, weeks]);

  const getLevel = (count: number) => {
    if (count === 0) return 0;
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px] min-w-fit">
        {Array.from({ length: weeks }).map((_, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-[3px]">
            {days.slice(weekIdx * 7, (weekIdx + 1) * 7).map((day) => (
              <div
                key={day.date.toISOString()}
                title={`${format(day.date, 'MMM d')}: ${day.count} solved`}
                className={cn(
                  'h-3 w-3 rounded-sm transition-colors',
                  `heatmap-cell-${getLevel(day.count)}`,
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <div key={l} className={cn('h-3 w-3 rounded-sm', `heatmap-cell-${l}`)} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
