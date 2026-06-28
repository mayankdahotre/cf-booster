import { Link, useLocation } from 'react-router-dom';
import { useSettingsStore } from '@/store';
import { cn, getRatingHex } from '@/utils';

const navLinks = [
  { name: 'Dashboard', href: '/' },
  { name: 'Tasks', href: '/tasks' },
  { name: 'Problems', href: '/problems' },
  { name: 'Patterns', href: '/patterns' },
  { name: 'Mistakes', href: '/mistakes' },
  { name: 'Review', href: '/review' },
  { name: 'Contests', href: '/contests' },
  { name: 'Analytics', href: '/analytics' },
];

export function CFHeader() {
  const location = useLocation();
  const settings = useSettingsStore((s) => s.settings);

  return (
    <header className="sticky top-0 z-50 w-full bg-cf-header text-white shadow-sm">
      <div className="flex h-10 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 text-white no-underline hover:no-underline">
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Verdana, Arial, sans-serif' }}>
              CF<span className="font-normal opacity-90">Booster</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'px-2.5 py-1 text-[13px] text-white/90 no-underline hover:no-underline hover:bg-white/15 rounded-sm transition-colors',
                    isActive && 'bg-white/20 font-bold text-white',
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-[13px]">
          {settings && (
            <span className="font-bold text-white">
              {settings.handle ?? settings.username ?? 'User'}
              {settings.currentRating ? (
                <span style={{ color: getRatingHex(settings.currentRating) }}> ({settings.currentRating})</span>
              ) : null}
            </span>
          )}
          <Link
            to="/settings"
            className="text-white/90 no-underline hover:no-underline hover:underline"
          >
            Settings
          </Link>
          <Link
            to="/profile"
            className="text-white/90 no-underline hover:no-underline hover:underline"
          >
            Profile
          </Link>
        </div>
      </div>
    </header>
  );
}
