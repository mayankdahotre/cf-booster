import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { type ColumnDef } from '@tanstack/react-table';
import { Download } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DataTable } from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { db } from '@/db';
import type { Problem } from '@/types';
import { cn, getRatingColor, getRatingBg, downloadFile } from '@/utils';
import { exportProblemsCSV } from '@/services/problemService';
import { format } from 'date-fns';
import type { FilterFn } from '@tanstack/react-table';

const problemFilter: FilterFn<Problem> = (row, _columnId, filterValue) => {
  const q = String(filterValue).toLowerCase();
  if (!q) return true;
  const p = row.original;
  const haystack = [
    p.name,
    `${p.contestId}${p.problemIndex}`,
    p.technique,
    p.observation,
    p.recognitionTrigger,
    p.status,
    ...p.tags,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
};

export default function ProblemsPage() {
  const problems = useLiveQuery(() => db.problems.toArray(), []) ?? [];
  const solvedProblems = problems.filter((p) => p.status !== 'not_solved');

  const columns = useMemo<ColumnDef<Problem, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Problem',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.contestId}
              {row.original.problemIndex}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'rating',
        header: 'Rating',
        cell: ({ row }) => (
          <Badge
            variant="rating"
            className={cn(getRatingBg(row.original.rating), getRatingColor(row.original.rating))}
          >
            {row.original.rating ?? '—'}
          </Badge>
        ),
      },
      {
        accessorKey: 'tags',
        header: 'Tags',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {row.original.tags.slice(0, 2).map((t) => (
              <Badge key={t} variant="tag" className="text-[10px]">
                {t}
              </Badge>
            ))}
            {row.original.tags.length > 2 && (
              <Badge variant="tag" className="text-[10px]">
                +{row.original.tags.length - 2}
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'solvedAt',
        header: 'Date',
        cell: ({ row }) =>
          row.original.solvedAt
            ? format(new Date(row.original.solvedAt), 'MMM d, yyyy')
            : '—',
      },
      {
        accessorKey: 'technique',
        header: 'Technique',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
            {row.original.technique ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'hintUsed',
        header: 'Hint',
        cell: ({ row }) => (row.original.hintUsed ? 'Yes' : 'No'),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.status === 'mastered'
                ? 'success'
                : row.original.status === 'solved'
                  ? 'default'
                  : 'outline'
            }
          >
            {row.original.status.replace('_', ' ')}
          </Badge>
        ),
      },
      {
        accessorKey: 'reviewStatus',
        header: 'Review',
        cell: ({ row }) => row.original.reviewStatus?.replace('_', ' ') ?? '—',
      },
    ],
    [],
  );

  const handleExport = () => {
    const csv = exportProblemsCSV(solvedProblems);
    downloadFile(csv, 'cf-booster-problems.csv', 'text/csv');
  };

  return (
    <AppLayout title="Problems" description="Your solved problems library">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
        <DataTable
          data={solvedProblems}
          columns={columns}
          globalFilterFn={problemFilter}
          searchPlaceholder="Search problems, techniques, tags..."
        />
      </div>
    </AppLayout>
  );
}
