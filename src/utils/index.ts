import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRating(rating?: number): string {
  if (!rating) return '—';
  return rating.toString();
}

/** Official Codeforces rating colors */
export const CF_RATING_COLORS = {
  unrated: '#000000',
  newbie: '#808080',
  pupil: '#008000',
  specialist: '#03a89e',
  expert: '#0000ff',
  candidateMaster: '#aa00aa',
  master: '#ff8c00',
  internationalMaster: '#ff0000',
  legendary: '#aa0000',
} as const;

export function getRatingColor(rating?: number): string {
  if (!rating) return 'text-foreground';
  if (rating < 1200) return 'text-[#808080]';
  if (rating < 1400) return 'text-[#008000]';
  if (rating < 1600) return 'text-[#03a89e]';
  if (rating < 1900) return 'text-[#0000ff]';
  if (rating < 2100) return 'text-[#aa00aa]';
  if (rating < 2400) return 'text-[#ff8c00]';
  return 'text-[#aa0000]';
}

export function getRatingBg(rating?: number): string {
  if (!rating) return 'bg-secondary';
  if (rating < 1200) return 'bg-[#808080]/15';
  if (rating < 1400) return 'bg-[#008000]/15';
  if (rating < 1600) return 'bg-[#03a89e]/15';
  if (rating < 1900) return 'bg-[#0000ff]/10';
  if (rating < 2100) return 'bg-[#aa00aa]/10';
  if (rating < 2400) return 'bg-[#ff8c00]/15';
  return 'bg-[#aa0000]/15';
}

export function getRatingHex(rating?: number): string {
  if (!rating) return CF_RATING_COLORS.unrated;
  if (rating < 1200) return CF_RATING_COLORS.newbie;
  if (rating < 1400) return CF_RATING_COLORS.pupil;
  if (rating < 1600) return CF_RATING_COLORS.specialist;
  if (rating < 1900) return CF_RATING_COLORS.expert;
  if (rating < 2100) return CF_RATING_COLORS.candidateMaster;
  if (rating < 2400) return CF_RATING_COLORS.master;
  return CF_RATING_COLORS.legendary;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}
