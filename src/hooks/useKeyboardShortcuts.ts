import { useEffect } from 'react';
import { useAppStore } from '@/store';

export function useKeyboardShortcuts() {
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const commandPaletteOpen = useAppStore((s) => s.commandPaletteOpen);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [commandPaletteOpen, setCommandPaletteOpen]);
}
