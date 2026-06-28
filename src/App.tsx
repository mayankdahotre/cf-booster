import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { KeyboardShortcutsProvider } from '@/hooks/KeyboardShortcutsProvider';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Problems = lazy(() => import('@/pages/Problems'));
const Patterns = lazy(() => import('@/pages/Patterns'));
const Mistakes = lazy(() => import('@/pages/Mistakes'));
const Review = lazy(() => import('@/pages/Review'));
const Contests = lazy(() => import('@/pages/Contests'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Settings = lazy(() => import('@/pages/Settings'));
const Profile = lazy(() => import('@/pages/Profile'));
const Tasks = lazy(() => import('@/pages/Tasks'));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export function AppRouter() {
  return (
    <KeyboardShortcutsProvider>
      <HashRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/problems" element={<Problems />} />
            <Route path="/patterns" element={<Patterns />} />
            <Route path="/mistakes" element={<Mistakes />} />
            <Route path="/review" element={<Review />} />
            <Route path="/contests" element={<Contests />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </KeyboardShortcutsProvider>
  );
}
