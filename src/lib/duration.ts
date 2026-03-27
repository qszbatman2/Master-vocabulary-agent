export const MAX_INCREMENT_SECONDS = 6 * 60 * 60;
export const MAX_DAILY_SECONDS = 12 * 60 * 60;

export function sanitizeDurationSeconds(
  raw: unknown,
  maxSeconds: number = MAX_INCREMENT_SECONDS
): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return 0;
  const v = Math.floor(n);
  if (v <= 0) return 0;
  if (!Number.isFinite(maxSeconds) || maxSeconds <= 0) return v;
  return Math.min(v, Math.floor(maxSeconds));
}

export function addClampedDurationSeconds(
  currentSecondsRaw: unknown,
  incrementRaw: unknown,
  maxDailySeconds: number = MAX_DAILY_SECONDS,
  maxIncrementSeconds: number = MAX_INCREMENT_SECONDS
): number {
  const currentN = typeof currentSecondsRaw === 'number' ? currentSecondsRaw : Number(currentSecondsRaw);
  const current = Number.isFinite(currentN) ? Math.max(0, Math.floor(currentN)) : 0;
  const inc = sanitizeDurationSeconds(incrementRaw, maxIncrementSeconds);
  if (inc <= 0) return current;

  const sum = current + inc;
  if (!Number.isFinite(maxDailySeconds) || maxDailySeconds <= 0) return sum;
  return Math.min(sum, Math.floor(maxDailySeconds));
}
