import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ListChecks,
  BookOpen,
  AlertTriangle,
  RotateCcw,
  Trophy,
  BarChart3,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { cn } from '@/utils';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Problems', href: '/problems', icon: ListChecks },
  { name: 'Patterns', href: '/patterns', icon: BookOpen },
  { name: 'Mistakes', href: '/mistakes', icon: AlertTriangle },
  { name: 'Review', href: '/review', icon: RotateCcw, badge: true },
  { name: 'Contests', href: '/contests', icon: Trophy },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Profile', href: '/profile', icon: User },
];

interface SidebarProps {
  reviewCount?: number;
}

export function Sidebar({ reviewCount = 0 }: SidebarProps) {
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen, setCommandPaletteOpen } = useAppStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 220 : 56 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed left-0 top-10 z-40 flex h-[calc(100vh-2.5rem)] flex-col border-r border-cf-border bg-card"
    >
      {sidebarOpen && (
        <div className="px-3 py-2 border-b border-border bg-secondary">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-8 text-muted-foreground bg-white border-cf-border text-xs"
            onClick={() => setCommandPaletteOpen(true)}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search...</span>
            <kbd className="ml-auto font-mono text-[10px] text-muted-foreground">⌘K</kbd>
          </Button>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              title={item.name}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 text-[13px] no-underline hover:no-underline transition-colors border-l-[3px]',
                isActive
                  ? 'border-l-cf-header bg-accent text-cf-link font-bold'
                  : 'border-l-transparent text-foreground hover:bg-secondary',
              )}
            >
              <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-cf-link' : 'text-muted-foreground')} />
              {sidebarOpen && (
                <>
                  <span className="truncate">{item.name}</span>
                  {item.badge && reviewCount > 0 && (
                    <span className="ml-auto rounded-sm bg-cf-header px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {reviewCount}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="icon"
          className="w-full h-8 text-muted-foreground hover:bg-secondary"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
    </motion.aside>
  );
}
