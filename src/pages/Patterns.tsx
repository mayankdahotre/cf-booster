import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { Pattern, PatternCategory } from '@/types';

const CATEGORIES: PatternCategory[] = [
  'Greedy',
  'Prefix Sum',
  'Sliding Window',
  'Two Pointers',
  'Binary Search',
  'Bit Manipulation',
  'DP',
  'Graph',
  'Trees',
  'Math',
  'Constructive',
  'Strings',
];

interface PatternFormState {
  category: PatternCategory;
  name: string;
  recognitionTrigger: string;
  observation: string;
  technique: string;
  complexity: string;
  mistakesToAvoid: string;
  exampleProblems: string;
  relatedPatterns: string;
}

const emptyForm = (): PatternFormState => ({
  category: 'Greedy',
  name: '',
  recognitionTrigger: '',
  observation: '',
  technique: '',
  complexity: '',
  mistakesToAvoid: '',
  exampleProblems: '',
  relatedPatterns: '',
});

function splitList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinList(items: string[]): string {
  return items.join('\n');
}

function patternToForm(pattern: Pattern): PatternFormState {
  return {
    category: pattern.category,
    name: pattern.name,
    recognitionTrigger: pattern.recognitionTrigger,
    observation: pattern.observation,
    technique: pattern.technique,
    complexity: pattern.complexity,
    mistakesToAvoid: joinList(pattern.mistakesToAvoid),
    exampleProblems: joinList(pattern.exampleProblems),
    relatedPatterns: joinList(pattern.relatedPatterns),
  };
}

export default function PatternsPage() {
  const patterns = useLiveQuery(() => db.patterns.toArray(), []) ?? [];
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<PatternCategory | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PatternFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = patterns.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.technique.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const grouped = CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = filtered.filter((p) => p.category === cat);
      return acc;
    },
    {} as Record<PatternCategory, Pattern[]>,
  );

  const openAddDialog = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (pattern: Pattern) => {
    setEditingId(pattern.id);
    setForm(patternToForm(pattern));
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError('Pattern name is required.');
      return;
    }
    if (!form.recognitionTrigger.trim()) {
      setFormError('Recognition trigger is required.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const now = new Date().toISOString();
      const existing = editingId ? await db.patterns.get(editingId) : undefined;

      const pattern: Pattern = {
        id: editingId ?? generateId(),
        category: form.category,
        name: form.name.trim(),
        recognitionTrigger: form.recognitionTrigger.trim(),
        observation: form.observation.trim(),
        technique: form.technique.trim(),
        complexity: form.complexity.trim() || '—',
        mistakesToAvoid: splitList(form.mistakesToAvoid),
        exampleProblems: splitList(form.exampleProblems),
        relatedPatterns: splitList(form.relatedPatterns),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      await db.patterns.put(pattern);
      setDialogOpen(false);
      setExpanded(pattern.id);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save pattern.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pattern: Pattern) => {
    if (!window.confirm(`Delete pattern "${pattern.name}"?`)) return;
    await db.patterns.delete(pattern.id);
    if (expanded === pattern.id) setExpanded(null);
  };

  const visibleCategories = activeCategory === 'all' ? CATEGORIES : [activeCategory];
  const hasVisiblePatterns = visibleCategories.some((cat) => grouped[cat]?.length);

  return (
    <AppLayout title="Pattern Library" description="Recognition triggers and techniques">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-start sm:justify-between">
          <div className="flex flex-col gap-4 flex-1">
            <Input
              placeholder="Search patterns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={activeCategory === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setActiveCategory('all')}
              >
                All
              </Badge>
              {CATEGORIES.map((cat) => (
                <Badge
                  key={cat}
                  variant={activeCategory === cat ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
          <Button onClick={openAddDialog} className="gap-1 shrink-0">
            <Plus className="h-4 w-4" />
            Add Pattern
          </Button>
        </div>

        {!hasVisiblePatterns && (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground">
              <p className="text-sm">
                {patterns.length === 0
                  ? 'No patterns yet. Click "Add Pattern" to create your first one.'
                  : 'No patterns match your search or filter.'}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {visibleCategories.map((cat) => {
            const items = grouped[cat];
            if (!items?.length) return null;
            return (
              <div key={cat}>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="gradient-text">{cat}</span>
                  <Badge variant="secondary">{items.length}</Badge>
                </h2>
                <div className="grid gap-3">
                  {items.map((pattern) => (
                    <PatternCard
                      key={pattern.id}
                      pattern={pattern}
                      expanded={expanded === pattern.id}
                      onToggle={() =>
                        setExpanded(expanded === pattern.id ? null : pattern.id)
                      }
                      onEdit={() => openEditDialog(pattern)}
                      onDelete={() => handleDelete(pattern)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Pattern' : 'Add Pattern'}</DialogTitle>
            <DialogDescription>
              Document a technique you want to recognize quickly during contests.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm text-muted-foreground">Category</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value as PatternCategory }))
                }
                className="mt-1 flex h-8 w-full rounded-[3px] border border-cf-border bg-white px-3 text-[13px] focus:outline focus:outline-2 focus:outline-cf-link"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Name *</label>
              <Input
                className="mt-1"
                placeholder="e.g. Binary Search on Answer"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Recognition Trigger *</label>
              <Textarea
                className="mt-1"
                placeholder="When do you know to use this pattern?"
                value={form.recognitionTrigger}
                onChange={(e) => setForm((f) => ({ ...f, recognitionTrigger: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Observation</label>
              <Textarea
                className="mt-1"
                placeholder="Key insight that unlocks the problem"
                value={form.observation}
                onChange={(e) => setForm((f) => ({ ...f, observation: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Technique</label>
              <Textarea
                className="mt-1"
                placeholder="Steps to apply the pattern"
                value={form.technique}
                onChange={(e) => setForm((f) => ({ ...f, technique: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Complexity</label>
              <Input
                className="mt-1"
                placeholder="e.g. O(n log n)"
                value={form.complexity}
                onChange={(e) => setForm((f) => ({ ...f, complexity: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Mistakes to Avoid</label>
              <Textarea
                className="mt-1"
                placeholder="One per line"
                value={form.mistakesToAvoid}
                onChange={(e) => setForm((f) => ({ ...f, mistakesToAvoid: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Example Problems</label>
              <Textarea
                className="mt-1"
                placeholder="One per line, e.g. 1705C - Mark and His Unfinished Essay"
                value={form.exampleProblems}
                onChange={(e) => setForm((f) => ({ ...f, exampleProblems: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Related Patterns</label>
              <Textarea
                className="mt-1"
                placeholder="One per line"
                value={form.relatedPatterns}
                onChange={(e) => setForm((f) => ({ ...f, relatedPatterns: e.target.value }))}
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
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Pattern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function PatternCard({
  pattern,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  pattern: Pattern;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="glass hover:border-primary/30 transition-colors">
      <CardHeader className="py-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{pattern.name}</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              title="Edit pattern"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete pattern"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{pattern.recognitionTrigger}</p>
      </CardHeader>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0 space-y-4 border-t border-border/50">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Observation
                </h4>
                <p className="text-sm">{pattern.observation || '—'}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Technique
                </h4>
                <p className="text-sm">{pattern.technique || '—'}</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Complexity
                  </h4>
                  <Badge variant="outline" className="font-mono">
                    {pattern.complexity}
                  </Badge>
                </div>
              </div>
              {pattern.mistakesToAvoid.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Mistakes to Avoid
                  </h4>
                  <ul className="space-y-1">
                    {pattern.mistakesToAvoid.map((m) => (
                      <li key={m} className="text-sm text-destructive/80 flex items-start gap-2">
                        <span>•</span> {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {pattern.exampleProblems.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Example Problems
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {pattern.exampleProblems.map((p) => (
                      <Badge key={p} variant="secondary">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {pattern.relatedPatterns.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Related Patterns
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {pattern.relatedPatterns.map((p) => (
                      <Badge key={p} variant="outline">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
