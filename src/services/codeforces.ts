import type { CodeforcesProblemMeta } from '@/types';

export type CFPageType =
  | 'problemset'
  | 'contest_problem'
  | 'contest'
  | 'submission'
  | 'profile'
  | 'unknown';

export function detectPageType(url: string): CFPageType {
  if (/\/problemset\/problem\/\d+\/[A-Z]\d*/i.test(url)) return 'problemset';
  if (/\/contest\/\d+\/problem\/[A-Z]\d*/i.test(url)) return 'contest_problem';
  if (/\/contest\/\d+(\/)?$/i.test(url)) return 'contest';
  if (/\/contest\/\d+\/submission\/\d+/i.test(url)) return 'submission';
  if (/\/profile\/[\w.-]+/i.test(url)) return 'profile';
  return 'unknown';
}

export function parseProblemFromDOM(): CodeforcesProblemMeta | null {
  const url = window.location.href;
  const pageType = detectPageType(url);

  if (pageType !== 'problemset' && pageType !== 'contest_problem') return null;

  let contestId: number;
  let problemIndex: string;

  const problemsetMatch = url.match(/problemset\/problem\/(\d+)\/([A-Z]\d*)/i);
  const contestMatch = url.match(/contest\/(\d+)\/problem\/([A-Z]\d*)/i);

  if (problemsetMatch) {
    contestId = parseInt(problemsetMatch[1], 10);
    problemIndex = problemsetMatch[2].toUpperCase();
  } else if (contestMatch) {
    contestId = parseInt(contestMatch[1], 10);
    problemIndex = contestMatch[2].toUpperCase();
  } else {
    return null;
  }

  const titleEl =
    document.querySelector('.title') ||
    document.querySelector('.header .title') ||
    document.querySelector('div[class*="title"]');

  const name = titleEl?.textContent?.trim().replace(/\s+/g, ' ') ?? `Problem ${problemIndex}`;

  const ratingEl = document.querySelector('span[title="Difficulty"]') as HTMLElement | null;
  const ratingText = ratingEl?.textContent?.trim();
  const rating = ratingText ? parseInt(ratingText.replace(/\D/g, ''), 10) : undefined;

  const tagEls = document.querySelectorAll('.tag-box a, .roundbox li a[href*="tags"]');
  const tags = Array.from(tagEls)
    .map((el) => el.textContent?.trim())
    .filter((t): t is string => !!t && t.length > 0);

  return {
    contestId,
    problemIndex,
    name: name.replace(/^[A-Z]\d*\.\s*/, ''),
    rating: isNaN(rating as number) ? undefined : rating,
    tags: [...new Set(tags)],
    url,
  };
}

export function isAcceptedSubmission(): boolean {
  const verdict = document.querySelector('.verdict-accepted, .submission-verdict-accepted');
  return !!verdict;
}

export function parseSubmissionProblem(): CodeforcesProblemMeta | null {
  const problemLink = document.querySelector(
    '.submission-link, a[href*="/problem/"]',
  ) as HTMLAnchorElement | null;

  if (!problemLink?.href) return null;

  const match = problemLink.href.match(/(?:problemset|contest)\/(\d+)\/problem\/([A-Z]\d*)/i);
  if (!match) return null;

  return {
    contestId: parseInt(match[1], 10),
    problemIndex: match[2].toUpperCase(),
    name: problemLink.textContent?.trim() ?? '',
    tags: [],
    url: problemLink.href,
  };
}
