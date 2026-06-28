import { useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '@/store';
import { db } from '@/db';
import { exportAllData, importData } from '@/services/problemService';
import { codeforcesProfileUrl } from '@/services/codeforcesApi';
import { syncCodeforcesAccount } from '@/services/codeforcesSync';
import { downloadFile, getRatingColor, cn } from '@/utils';
import { Download, Upload, Database, Bell, Keyboard, Cloud, User, ExternalLink, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const { settings, updateSettings, setSettings } = useSettingsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [handleInput, setHandleInput] = useState(settings?.handle ?? '');
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);

  const saveSettings = async (partial: Parameters<typeof updateSettings>[0]) => {
    updateSettings(partial);
    if (settings) {
      const updated = {
        ...settings,
        ...partial,
        updatedAt: new Date().toISOString(),
      };
      await db.settings.put(updated);
      setSettings(updated);
    }
  };

  const runSync = async (handle: string, clearDemo: boolean) => {
    const result = await syncCodeforcesAccount(handle, { clearDemo });
    const updated = await db.settings.get('default');
    if (updated) setSettings(updated);
    return result;
  };

  const handleConnectAccount = async () => {
    setConnecting(true);
    setConnectError(null);
    setConnectSuccess(null);
    try {
      const result = await runSync(handleInput, true);
      setConnectSuccess(
        `Synced ${result.problemsSynced} solved problems and ${result.contestsSynced} contests for ${handleInput.trim()} (rating ${result.currentRating}).`,
      );
    } catch (error) {
      setConnectError(error instanceof Error ? error.message : 'Failed to sync account.');
    } finally {
      setConnecting(false);
    }
  };

  const handleSyncNow = async () => {
    if (!settings?.handle) return;
    setSyncing(true);
    setConnectError(null);
    setConnectSuccess(null);
    try {
      const result = await runSync(settings.handle, false);
      setConnectSuccess(
        `Updated: ${result.problemsSynced} problems, ${result.contestsSynced} contests.`,
      );
    } catch (error) {
      setConnectError(error instanceof Error ? error.message : 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    await saveSettings({
      handle: undefined,
      username: undefined,
      avatarUrl: undefined,
      lastCodeforcesSync: undefined,
    });
    setHandleInput('');
    setConnectSuccess(null);
    setConnectError(null);
  };

  const handleExport = async () => {
    const data = await exportAllData();
    downloadFile(data, `cf-booster-backup-${Date.now()}.json`, 'application/json');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await importData(text);
    window.location.reload();
  };

  return (
    <AppLayout title="Settings" description="Configure your CF Booster experience">
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Codeforces Account
            </CardTitle>
            <CardDescription>
              Connect your handle to import solved problems, contest history, and rating from
              Codeforces.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings?.handle ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-cf-border bg-secondary/40 px-3 py-2">
                <div>
                  <p className="font-bold">
                    <span className={cn(getRatingColor(settings.currentRating))}>
                      {settings.handle}
                    </span>
                    {settings.currentRating ? ` · ${settings.currentRating}` : ''}
                  </p>
                  {settings.username && settings.username !== settings.handle && (
                    <p className="text-xs text-muted-foreground">{settings.username}</p>
                  )}
                  {settings.lastCodeforcesSync && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Last synced{' '}
                      {formatDistanceToNow(new Date(settings.lastCodeforcesSync), {
                        addSuffix: true,
                      })}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncNow}
                    disabled={syncing}
                    className="gap-1"
                  >
                    <RefreshCw className={cn('h-3 w-3', syncing && 'animate-spin')} />
                    {syncing ? 'Syncing...' : 'Sync now'}
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={codeforcesProfileUrl(settings.handle)}
                      target="_blank"
                      rel="noreferrer"
                      className="gap-1 no-underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Profile
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDisconnect}>
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <Badge variant="secondary">No account connected</Badge>
            )}

            <div>
              <label className="text-sm text-muted-foreground">Codeforces handle</label>
              <div className="mt-1 flex gap-2">
                <Input
                  placeholder="e.g. tourist"
                  value={handleInput}
                  onChange={(e) => setHandleInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnectAccount()}
                />
                <Button onClick={handleConnectAccount} disabled={connecting || !handleInput.trim()}>
                  {connecting ? 'Syncing...' : settings?.handle ? 'Re-sync' : 'Connect'}
                </Button>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Fetches your AC submissions and contest history via the public Codeforces API. First
                connect replaces any demo data with your real solves.
              </p>
            </div>

            {connectError && (
              <p className="text-sm text-destructive border border-red-200 bg-red-50 rounded-[3px] px-3 py-2">
                {connectError}
              </p>
            )}
            {connectSuccess && (
              <p className="text-sm text-[#008000] border border-green-200 bg-green-50 rounded-[3px] px-3 py-2">
                {connectSuccess}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Goals</CardTitle>
            <CardDescription>Set your competitive programming targets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Target Rating</label>
                <Input
                  type="number"
                  value={settings?.targetRating ?? 1800}
                  onChange={(e) => saveSettings({ targetRating: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Current Rating</label>
                <Input
                  type="number"
                  value={settings?.currentRating ?? 1500}
                  onChange={(e) => saveSettings({ currentRating: parseInt(e.target.value) })}
                  className="mt-1"
                  disabled={!!settings?.handle}
                />
                {settings?.handle && (
                  <p className="text-xs text-muted-foreground mt-1">Synced from Codeforces</p>
                )}
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Weekly Goal</label>
                <Input
                  type="number"
                  value={settings?.weeklyGoal ?? 15}
                  onChange={(e) => saveSettings({ weeklyGoal: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Monthly Goal</label>
                <Input
                  type="number"
                  value={settings?.monthlyGoal ?? 50}
                  onChange={(e) => saveSettings({ monthlyGoal: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enable Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Daily review reminders and contest alerts
                </p>
              </div>
              <Switch
                checked={settings?.notificationsEnabled ?? true}
                onCheckedChange={(checked) => saveSettings({ notificationsEnabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data Management
            </CardTitle>
            <CardDescription>Import, export, and backup your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleExport} className="gap-2">
                <Download className="h-4 w-4" />
                Export Backup
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Import Backup
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              Keyboard Shortcuts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(settings?.keyboardShortcuts ?? {}).map(([action, shortcut]) => (
              <div key={action} className="flex items-center justify-between">
                <span className="text-sm capitalize">{action.replace(/-/g, ' ')}</span>
                <kbd className="rounded border border-border bg-muted px-2 py-1 font-mono text-xs">
                  {shortcut}
                </kbd>
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm">Global Search</span>
              <kbd className="rounded border border-border bg-muted px-2 py-1 font-mono text-xs">
                Ctrl+K
              </kbd>
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              Cloud Sync
            </CardTitle>
            <CardDescription>Coming soon — architecture ready for future sync</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled>
              Connect Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
