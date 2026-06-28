import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { Plus, RefreshCw, Trash2, CheckCircle2, Circle, CalendarDays, CalendarRange } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { db } from '@/db';
import { useSettingsStore } from '@/store';
import type { DailyTask } from '@/types';
import {
  todayDateString,
  weekStartDateString,
  weekLabel,
  ensureAllTasks,
  generateDailyTasks,
  generateWeeklyTasks,
  toggleTaskComplete,
  addManualTask,
  deleteTask,
  taskTypeColor,
  isDailyTask,
  isWeeklyTask,
} from '@/services/dailyTasksService';
import { cn } from '@/utils';

const TASK_TYPES: DailyTask['type'][] = ['solve', 'review', 'weak_topic', 'contest'];

export default function TasksPage() {
  const settings = useSettingsStore((s) => s.settings);
  const today = todayDateString();
  const weekStart = weekStartDateString();
  const allTasks = useLiveQuery(() => db.dailyTasks.toArray(), []) ?? [];
  const problems = useLiveQuery(() => db.problems.toArray(), []) ?? [];

  const dailyTasks = allTasks
    .filter((t) => isDailyTask(t) && t.date === today)
    .sort((a, b) => Number(a.completed) - Number(b.completed));

  const weeklyTasks = allTasks
    .filter((t) => isWeeklyTask(t) && t.date === weekStart)
    .sort((a, b) => Number(a.completed) - Number(b.completed));

  const dailyDone = dailyTasks.filter((t) => t.completed).length;
  const weeklyDone = weeklyTasks.filter((t) => t.completed).length;
  const dailyProgress = dailyTasks.length ? Math.round((dailyDone / dailyTasks.length) * 100) : 0;
  const weeklyProgress = weeklyTasks.length ? Math.round((weeklyDone / weeklyTasks.length) * 100) : 0;

  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<DailyTask['type']>('solve');
  const [addPeriod, setAddPeriod] = useState<'daily' | 'weekly'>('daily');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openAddDialog = (period: 'daily' | 'weekly') => {
    setAddPeriod(period);
    setActiveTab(period);
    setDescription('');
    setTaskType('solve');
    setFormError(null);
    setDialogOpen(true);
  };

  const handleRegenerate = async (period: 'daily' | 'weekly') => {
    if (!settings) return;
    const tasks = period === 'daily' ? dailyTasks : weeklyTasks;
    const label = period === 'daily' ? 'today' : 'this week';
    if (
      tasks.some((t) => t.source !== 'manual') &&
      !window.confirm(`Replace auto-generated tasks for ${label}? Manual tasks will be kept.`)
    ) {
      return;
    }
    setRegenerating(true);
    try {
      if (period === 'daily') {
        await generateDailyTasks(settings, problems);
      } else {
        await generateWeeklyTasks(settings, problems);
      }
    } finally {
      setRegenerating(false);
    }
  };

  const handleAdd = async () => {
    if (!description.trim()) {
      setFormError('Description is required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await addManualTask({ description, type: taskType, period: addPeriod });
      setDialogOpen(false);
      setDescription('');
      setTaskType('solve');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to add task.');
    } finally {
      setSaving(false);
    }
  };

  const handleEnsureAll = async () => {
    await ensureAllTasks(settings ?? undefined);
  };

  return (
    <AppLayout title="Tasks" description="Daily and weekly practice goals">
      <div className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Practice Overview</CardTitle>
            <CardDescription>
              Daily tasks reset each day. Weekly tasks run Monday – Sunday.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium">
                  <CalendarDays className="h-4 w-4 text-cf-link" />
                  Today
                </span>
                <span className="text-muted-foreground">
                  {dailyDone}/{dailyTasks.length}
                </span>
              </div>
              <Progress value={dailyProgress} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium">
                  <CalendarRange className="h-4 w-4 text-cf-header" />
                  {weekLabel(weekStart)}
                </span>
                <span className="text-muted-foreground">
                  {weeklyDone}/{weeklyTasks.length}
                </span>
              </div>
              <Progress value={weeklyProgress} />
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Plans use your rating, goals, review queue, and mistakes from{' '}
              <Link to="/settings" className="text-cf-link hover:underline">
                Settings
              </Link>
              .
            </p>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'daily' | 'weekly')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily" className="gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Daily
              {dailyTasks.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
                  {dailyDone}/{dailyTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="weekly" className="gap-1.5">
              <CalendarRange className="h-3.5 w-3.5" />
              Weekly
              {weeklyTasks.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
                  {weeklyDone}/{weeklyTasks.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4 mt-4">
            <TaskSectionToolbar
              onRefresh={handleEnsureAll}
              onRegenerate={() => handleRegenerate('daily')}
              onAdd={() => openAddDialog('daily')}
              regenerating={regenerating}
              hasSettings={!!settings}
            />
            <TaskList
              tasks={dailyTasks}
              emptyMessage="No daily tasks yet."
              emptyAction={
                <Button size="sm" onClick={handleEnsureAll}>
                  Generate daily plan
                </Button>
              }
            />
          </TabsContent>

          <TabsContent value="weekly" className="space-y-4 mt-4">
            <TaskSectionToolbar
              onRefresh={handleEnsureAll}
              onRegenerate={() => handleRegenerate('weekly')}
              onAdd={() => openAddDialog('weekly')}
              regenerating={regenerating}
              hasSettings={!!settings}
            />
            <TaskList
              tasks={weeklyTasks}
              emptyMessage={`No weekly tasks for ${weekLabel(weekStart)} yet.`}
              emptyAction={
                <Button size="sm" onClick={handleEnsureAll}>
                  Generate weekly plan
                </Button>
              }
            />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {addPeriod === 'daily' ? 'Daily' : 'Weekly'} Task</DialogTitle>
            <DialogDescription>
              {addPeriod === 'daily'
                ? 'A goal to complete today.'
                : `A goal for the week of ${weekLabel(weekStart)}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm text-muted-foreground">Type</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as DailyTask['type'])}
                className="mt-1 flex h-8 w-full rounded-[3px] border border-cf-border bg-white px-3 text-[13px] focus:outline focus:outline-2 focus:outline-cf-link"
              >
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Description</label>
              <Textarea
                className="mt-1"
                placeholder={
                  addPeriod === 'daily'
                    ? "e.g. Upsolve yesterday's contest D"
                    : 'e.g. Virtual contest + upsolve 3 problems'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? 'Adding...' : 'Add Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function TaskSectionToolbar({
  onRefresh,
  onRegenerate,
  onAdd,
  regenerating,
  hasSettings,
}: {
  onRefresh: () => void;
  onRegenerate: () => void;
  onAdd: () => void;
  regenerating: boolean;
  hasSettings: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-end">
      <Button variant="outline" size="sm" onClick={onRefresh} className="gap-1">
        <RefreshCw className="h-3.5 w-3.5" />
        Refresh
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onRegenerate}
        disabled={regenerating || !hasSettings}
        className="gap-1"
      >
        <RefreshCw className={cn('h-3.5 w-3.5', regenerating && 'animate-spin')} />
        Regenerate
      </Button>
      <Button size="sm" onClick={onAdd} className="gap-1">
        <Plus className="h-3.5 w-3.5" />
        Add task
      </Button>
    </div>
  );
}

function TaskList({
  tasks,
  emptyMessage,
  emptyAction,
}: {
  tasks: DailyTask[];
  emptyMessage: string;
  emptyAction: React.ReactNode;
}) {
  if (tasks.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center space-y-4">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          {emptyAction}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          onToggle={() => toggleTaskComplete(task.id)}
          onDelete={() => deleteTask(task.id)}
        />
      ))}
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: DailyTask;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-[3px] border border-cf-border bg-white px-4 py-3 transition-colors',
        task.completed && 'opacity-60',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="shrink-0 text-cf-link hover:text-cf-header"
        title={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.completed ? (
          <CheckCircle2 className="h-5 w-5 text-[#008000]" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>
      <div className={cn('h-2 w-2 rounded-full shrink-0', taskTypeColor(task.type))} />
      <span
        className={cn('text-sm flex-1', task.completed && 'line-through text-muted-foreground')}
      >
        {task.description}
      </span>
      <Badge variant="outline" className="text-[10px] capitalize shrink-0">
        {task.type.replace('_', ' ')}
      </Badge>
      {task.source === 'manual' && (
        <Badge variant="secondary" className="text-[10px] shrink-0">
          Custom
        </Badge>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
        onClick={() => {
          if (window.confirm('Delete this task?')) onDelete();
        }}
        title="Delete task"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
