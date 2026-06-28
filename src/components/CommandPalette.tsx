import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Search,
  LayoutDashboard,
  ListChecks,
  BookOpen,
  CalendarCheck,
  AlertTriangle,
  RotateCcw,
  Trophy,
  BarChart3,
  Settings,
  User,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { db } from '@/db';
import type { SearchResult } from '@/types';
import { cn } from '@/utils';

const pages = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: CalendarCheck },
  { name: 'Problems', href: '/problems', icon: ListChecks },
  { name: 'Pattern Library', href: '/patterns', icon: BookOpen },
  { name: 'Mistake Log', href: '/mistakes', icon: AlertTriangle },
  { name: 'Review Queue', href: '/review', icon: RotateCcw },
  { name: 'Contest History', href: '/contests', icon: Trophy },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Profile', href: '/profile', icon: User },
];

export function CommandPalette() {
  const open = useAppStore((s) => s.commandPaletteOpen);
  const setOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, setOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const search = async () => {
      const q = query.toLowerCase();
      const found: SearchResult[] = [];

      const [problems, patterns, mistakes] = await Promise.all([
        db.problems.toArray(),
        db.patterns.toArray(),
        db.mistakes.toArray(),
      ]);

      problems.forEach((p) => {
        if (
          p.name.toLowerCase().includes(q) ||
          p.technique?.toLowerCase().includes(q) ||
          p.observation?.toLowerCase().includes(q) ||
          p.recognitionTrigger?.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
        ) {
          found.push({
            id: p.id,
            type: 'problem',
            title: p.name,
            subtitle: `${p.contestId}${p.problemIndex} · ${p.rating ?? '?'}`,
            href: '/problems',
          });
        }
      });

      patterns.forEach((p) => {
        if (
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.technique.toLowerCase().includes(q)
        ) {
          found.push({
            id: p.id,
            type: 'pattern',
            title: p.name,
            subtitle: p.category,
            href: '/patterns',
          });
        }
      });

      mistakes.forEach((m) => {
        if (
          m.problemName.toLowerCase().includes(q) ||
          m.lessonLearned.toLowerCase().includes(q)
        ) {
          found.push({
            id: m.id,
            type: 'mistake',
            title: m.problemName,
            subtitle: m.lessonLearned.slice(0, 60),
            href: '/mistakes',
          });
        }
      });

      setResults(found.slice(0, 10));
    };

    const timer = setTimeout(search, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const go = (href: string) => {
    navigate(href);
    setOpen(false);
    setQuery('');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]">
      <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <Command
        className="relative z-10 w-full max-w-xl cf-roundbox bg-white shadow-lg overflow-hidden"
        shouldFilter={false}
      >
        <div className="flex items-center border-b border-cf-border px-3 bg-secondary">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Search problems, patterns, techniques..."
            className="flex h-10 w-full bg-transparent px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-1 bg-white">
          {!query && (
            <Command.Group heading="Pages" className="text-xs text-muted-foreground px-2 py-1.5">
              {pages.map((page) => (
                <Command.Item
                  key={page.href}
                  onSelect={() => go(page.href)}
                  className={cn(
                    'flex items-center gap-3 rounded-[3px] px-3 py-2 text-[13px] cursor-pointer',
                    'aria-selected:bg-accent aria-selected:text-cf-link',
                  )}
                >
                  <page.icon className="h-4 w-4 text-muted-foreground" />
                  {page.name}
                </Command.Item>
              ))}
            </Command.Group>
          )}
          {query && results.length === 0 && (
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>
          )}
          {results.length > 0 && (
            <Command.Group heading="Results" className="text-xs text-muted-foreground px-2 py-1.5">
              {results.map((r) => (
                <Command.Item
                  key={r.id}
                  onSelect={() => go(r.href)}
                  className={cn(
                    'flex flex-col gap-0.5 rounded-lg px-3 py-2 text-sm cursor-pointer',
                    'aria-selected:bg-accent aria-selected:text-accent-foreground',
                  )}
                >
                  <span className="font-medium">{r.title}</span>
                  {r.subtitle && (
                    <span className="text-xs text-muted-foreground">{r.subtitle}</span>
                  )}
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </Command>
    </div>
  );
}
