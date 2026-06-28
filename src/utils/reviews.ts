import { formatISO, isPast, isToday, parseISO, startOfDay } from 'date-fns';

export function todayDateString(): string {
  return formatISO(new Date(), { representation: 'date' });
}

export function isReviewDue(dueDate: string): boolean {
  const due = startOfDay(parseISO(dueDate));
  return isToday(due) || isPast(due);
}

export function filterDueReviews<T extends { dueDate: string; skipped: boolean }>(
  reviews: T[],
): T[] {
  return reviews.filter((r) => !r.skipped && isReviewDue(r.dueDate));
}
