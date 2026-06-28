import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DataTable } from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { db, generateId } from '@/db';
import type { Mistake, Problem } from '@/types';
import { cn, getRatingColor, getRatingBg } from '@/utils';
import { format } from 'date-fns';
import type { FilterFn } from '@tanstack/react-table';

const mistakeFilter: FilterFn<Mistake> = (row, _columnId, filterValue) => {
  const q = String(filterValue).toLowerCase();
  if (!q) return true;
  const m = row.original;
  return [
    m.problemName,
    m.whatIThought,
    m.missingObservation,
    m.correctObservation,
    m.technique,
    m.lessonLearned,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(q);
};

interface MistakeFormState {
  problemId: string;
  problemName: string;
  rating: string;
  whatIThought: string;
  missingObservation: string;
  correctObservation: string;
  technique: string;
  lessonLearned: string;
  reviewDate: string;
}

const emptyForm = (): MistakeFormState => ({
  problemId: '',
  problemName: '',
  rating: '',
  whatIThought: '',
  missingObservation: '',
  correctObservation: '',
  technique: '',
  lessonLearned: '',
  reviewDate: '',
});

function mistakeToForm(mistake: Mistake): MistakeFormState {
  return {
    problemId: mistake.problemId,
    problemName: mistake.problemName,
    rating: mistake.rating?.toString() ?? '',
    whatIThought: mistake.whatIThought,
    missingObservation: mistake.missingObservation,
    correctObservation: mistake.correctObservation,
    technique: mistake.technique,
    lessonLearned: mistake.lessonLearned,
    reviewDate: mistake.reviewDate ?? '',
  };
}

export default function MistakesPage() {
  const mistakes = useLiveQuery(() => db.mistakes.toArray(), []) ?? [];
  const problems = useLiveQuery(() => db.problems.toArray(), []) ?? [];
  const solvedProblems = problems.filter((p) => p.status !== 'not_solved');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MistakeFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openAddDialog = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (mistake: Mistake) => {
    setEditingId(mistake.id);
    setForm(mistakeToForm(mistake));
    setFormError(null);
    setDialogOpen(true);
  };

  const handleProblemSelect = (problemId: string) => {
    if (!problemId) {
      setForm((f) => ({ ...f, problemId: '', problemName: '', rating: '' }));
      return;
    }
    const problem = solvedProblems.find((p) => p.id === problemId);
    if (!problem) return;
    setForm((f) => ({
      ...f,
      problemId: problem.id,
      problemName: `${problem.contestId}${problem.problemIndex} — ${problem.name}`,
      rating: problem.rating?.toString() ?? '',
    }));
  };

  const handleSave = async () => {
    if (!form.problemName.trim()) {
      setFormError('Problem name is required.');
      return;
    }
    if (!form.whatIThought.trim()) {
      setFormError('What you thought is required.');
      return;
    }
    if (!form.missingObservation.trim()) {
      setFormError('Missing observation is required.');
      return;
    }
    if (!form.correctObservation.trim()) {
      setFormError('Correct observation is required.');
      return;
    }
    if (!form.lessonLearned.trim()) {
      setFormError('Lesson learned is required.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const now = new Date().toISOString();
      const existing = editingId ? await db.mistakes.get(editingId) : undefined;
      const problemId =
        form.problemId.trim() ||
        form.problemName.trim().replace(/\s+/g, '-').toLowerCase().slice(0, 64);

      const mistake: Mistake = {
        id: editingId ?? generateId(),
        problemId,
        problemName: form.problemName.trim(),
        rating: form.rating ? parseInt(form.rating, 10) : undefined,
        whatIThought: form.whatIThought.trim(),
        missingObservation: form.missingObservation.trim(),
        correctObservation: form.correctObservation.trim(),
        technique: form.technique.trim(),
        lessonLearned: form.lessonLearned.trim(),
        reviewDate: form.reviewDate || undefined,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      await db.mistakes.put(mistake);
      setDialogOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save mistake.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (mistake: Mistake) => {
    if (!window.confirm(`Delete mistake for "${mistake.problemName}"?`)) return;
    await db.mistakes.delete(mistake.id);
  };

  const columns = useMemo<ColumnDef<Mistake, unknown>[]>(
    () => [
      {
        accessorKey: 'problemName',
        header: 'Problem',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.problemName}</span>
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
        accessorKey: 'whatIThought',
        header: 'What I Thought',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
            {row.original.whatIThought}
          </span>
        ),
      },
      {
        accessorKey: 'missingObservation',
        header: 'Missing Observation',
        cell: ({ row }) => (
          <span className="text-sm text-destructive/80 max-w-[200px] truncate block">
            {row.original.missingObservation}
          </span>
        ),
      },
      {
        accessorKey: 'correctObservation',
        header: 'Correct Observation',
        cell: ({ row }) => (
          <span className="text-sm text-cf-green max-w-[200px] truncate block">
            {row.original.correctObservation}
          </span>
        ),
      },
      {
        accessorKey: 'technique',
        header: 'Technique',
        cell: ({ row }) => row.original.technique || '—',
      },
      {
        accessorKey: 'lessonLearned',
        header: 'Lesson',
        cell: ({ row }) => (
          <span className="text-sm italic max-w-[200px] truncate block">
            {row.original.lessonLearned}
          </span>
        ),
      },
      {
        accessorKey: 'reviewDate',
        header: 'Review Date',
        cell: ({ row }) =>
          row.original.reviewDate
            ? format(new Date(row.original.reviewDate), 'MMM d, yyyy')
            : '—',
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => openEditDialog(row.original)}
              title="Edit mistake"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => handleDelete(row.original)}
              title="Delete mistake"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <AppLayout title="Mistake Log" description="Learn from every wrong turn">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={openAddDialog} className="gap-1">
            <Plus className="h-4 w-4" />
            Add Mistake
          </Button>
        </div>

        {mistakes.length === 0 ? (
          <div className="cf-roundbox bg-white py-12 text-center text-muted-foreground text-sm">
            No mistakes logged yet. Click &quot;Add Mistake&quot; to record what you learned from a
            problem.
          </div>
        ) : (
          <DataTable
            data={mistakes}
            columns={columns}
            globalFilterFn={mistakeFilter}
            searchPlaceholder="Search mistakes, lessons, techniques..."
          />
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Mistake' : 'Add Mistake'}</DialogTitle>
            <DialogDescription>
              Record what went wrong and what you should do differently next time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {solvedProblems.length > 0 && (
              <div>
                <label className="text-sm text-muted-foreground">Link to solved problem</label>
                <select
                  value={form.problemId}
                  onChange={(e) => handleProblemSelect(e.target.value)}
                  className="mt-1 flex h-8 w-full rounded-[3px] border border-cf-border bg-white px-3 text-[13px] focus:outline focus:outline-2 focus:outline-cf-link"
                >
                  <option value="">Custom / type manually below</option>
                  {solvedProblems.map((p: Problem) => (
                    <option key={p.id} value={p.id}>
                      {p.contestId}
                      {p.problemIndex} — {p.name}
                      {p.rating ? ` (${p.rating})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-sm text-muted-foreground">Problem *</label>
              <Input
                className="mt-1"
                placeholder="e.g. 1873D — 1D Eraser"
                value={form.problemName}
                onChange={(e) => setForm((f) => ({ ...f, problemName: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Rating</label>
              <Input
                className="mt-1"
                type="number"
                placeholder="e.g. 1200"
                value={form.rating}
                onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">What I Thought *</label>
              <Textarea
                className="mt-1"
                placeholder="Your initial (wrong) approach or assumption"
                value={form.whatIThought}
                onChange={(e) => setForm((f) => ({ ...f, whatIThought: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Missing Observation *</label>
              <Textarea
                className="mt-1"
                placeholder="What key insight did you miss?"
                value={form.missingObservation}
                onChange={(e) => setForm((f) => ({ ...f, missingObservation: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Correct Observation *</label>
              <Textarea
                className="mt-1"
                placeholder="The insight that solves the problem"
                value={form.correctObservation}
                onChange={(e) => setForm((f) => ({ ...f, correctObservation: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Technique</label>
              <Input
                className="mt-1"
                placeholder="e.g. Greedy segment counting"
                value={form.technique}
                onChange={(e) => setForm((f) => ({ ...f, technique: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Lesson Learned *</label>
              <Textarea
                className="mt-1"
                placeholder="What will you remember for next time?"
                value={form.lessonLearned}
                onChange={(e) => setForm((f) => ({ ...f, lessonLearned: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Review Date</label>
              <Input
                className="mt-1"
                type="date"
                value={form.reviewDate}
                onChange={(e) => setForm((f) => ({ ...f, reviewDate: e.target.value }))}
              />
            </div>

            {formError && (
              <p className="text-sm text-destructive border border-red-200 bg-red-50 rounded-[3px] px-3 py-2">
                {formError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Mistake'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
