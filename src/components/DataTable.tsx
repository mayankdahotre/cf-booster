import { useRef, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type FilterFn,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/utils';
import { ArrowUpDown } from 'lucide-react';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  searchPlaceholder?: string;
  globalFilterFn?: FilterFn<T>;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  globalFilterFn,
  className,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const parentRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: globalFilterFn ?? 'includesString',
  });

  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 8,
  });

  return (
    <div className={cn('space-y-4', className)}>
      <input
        placeholder={searchPlaceholder}
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="flex h-8 w-full max-w-sm rounded-[3px] border border-cf-border bg-white px-2 py-1 text-[13px] placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-cf-link"
      />
      <div className="cf-roundbox overflow-hidden bg-white">
        <div ref={parentRef} className="max-h-[520px] overflow-auto">
          <table className="cf-table w-full">
            <thead className="sticky top-0 z-10 bg-secondary">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && <ArrowUpDown className="h-3 w-3" />}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {virtualizer.getVirtualItems().length > 0 && virtualizer.getVirtualItems()[0]!.start > 0 && (
                <tr style={{ height: virtualizer.getVirtualItems()[0]!.start }} aria-hidden>
                  <td colSpan={columns.length} />
                </tr>
              )}
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <tr key={row.id} className="hover:bg-accent/60">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">No results found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export { type ColumnDef };
