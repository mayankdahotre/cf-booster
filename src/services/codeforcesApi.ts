export interface CodeforcesUserInfo {
  handle: string;
  firstName?: string;
  lastName?: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
  titlePhoto?: string;
  avatar?: string;
}

export interface CfProblem {
  contestId: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
}

export interface CfSubmission {
  id: number;
  contestId: number;
  creationTimeSeconds: number;
  verdict?: string;
  problem: CfProblem;
}

export interface CfRatingChange {
  contestId: number;
  contestName: string;
  rank: number;
  ratingUpdate: number;
  oldRating: number;
  newRating: number;
  ratingChangeTimeSeconds: number;
}

interface CfApiResponse<T> {
  status: 'OK' | 'FAILED';
  comment?: string;
  result?: T;
}

async function cfApiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`https://codeforces.com/api/${endpoint}`);
  if (!response.ok) {
    throw new Error('Could not reach Codeforces. Check your internet connection.');
  }
  const data = (await response.json()) as CfApiResponse<T>;
  if (data.status !== 'OK' || data.result === undefined) {
    throw new Error(data.comment ?? 'Codeforces API request failed.');
  }
  return data.result;
}

export async function fetchCodeforcesUser(handle: string): Promise<CodeforcesUserInfo> {
  const trimmed = handle.trim();
  if (!trimmed) throw new Error('Please enter your Codeforces handle.');

  const users = await cfApiGet<CodeforcesUserInfo[]>(
    `user.info?handles=${encodeURIComponent(trimmed)}`,
  );
  if (!users[0]) throw new Error(`User "${trimmed}" not found on Codeforces.`);
  return users[0];
}

export async function fetchAllSubmissions(handle: string): Promise<CfSubmission[]> {
  const trimmed = handle.trim();
  const all: CfSubmission[] = [];
  let from = 1;
  const pageSize = 10000;

  while (true) {
    const batch = await cfApiGet<CfSubmission[]>(
      `user.status?handle=${encodeURIComponent(trimmed)}&from=${from}&count=${pageSize}`,
    );
    all.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }

  return all;
}

export async function fetchUserRatingHistory(handle: string): Promise<CfRatingChange[]> {
  return cfApiGet<CfRatingChange[]>(`user.rating?handle=${encodeURIComponent(handle.trim())}`);
}

export function displayNameFromUser(user: CodeforcesUserInfo): string {
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return full || user.handle;
}

export function codeforcesProfileUrl(handle: string): string {
  return `https://codeforces.com/profile/${encodeURIComponent(handle)}`;
}
