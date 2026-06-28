import { ReactNode } from 'react';
import { useAppStore } from '@/store';
import { Sidebar } from './Sidebar';
import { CFHeader } from './CFHeader';
import { CommandPalette } from '@/components/CommandPalette';
import { cn } from '@/utils';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  reviewCount?: number;
}

export function AppLayout({ children, title, description, reviewCount }: AppLayoutProps) {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);

  return (
    <div className="min-h-screen bg-background">
      <CFHeader />
      <Sidebar reviewCount={reviewCount} />
      <CommandPalette />
      <main
        className={cn(
          'min-h-[calc(100vh-2.5rem)] transition-all duration-200 pt-2',
          sidebarOpen ? 'ml-[220px]' : 'ml-14',
        )}
      >
        <div className="mx-auto max-w-6xl px-4 pb-8">
          {(title || description) && (
            <div className="cf-roundbox mb-4">
              <div className="cf-roundbox-header">{title ?? 'CF Booster'}</div>
              {description && (
                <p className="px-4 py-2 text-[13px] text-muted-foreground border-b border-border">
                  {description}
                </p>
              )}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
