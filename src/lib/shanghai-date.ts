export function getShanghaiDateString(date: Date): string {
  const shanghaiTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return shanghaiTime.toISOString().split('T')[0];
}

export function getTodayShanghaiDateString(): string {
  return getShanghaiDateString(new Date());
}

export function getShanghaiDateWithOffset(daysOffset: number): string {
  const now = new Date();
  const shifted = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
  return getShanghaiDateString(shifted);
}

export function getShanghaiDateStartIso(dateString: string): string {
  return new Date(`${dateString}T00:00:00+08:00`).toISOString();
}

export function getShanghaiDateFromTimestamp(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return getShanghaiDateString(date);
}

function parseShanghaiDateString(dateString: string): number {
  const [year, month, day] = dateString.split('-').map(Number);
  return Date.UTC(year, (month || 1) - 1, day || 1);
}

export function getShanghaiDaySpan(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined
): number {
  const startDate = getShanghaiDateFromTimestamp(start);
  const endDate = getShanghaiDateFromTimestamp(end);
  if (!startDate || !endDate) return 0;
  return Math.floor((parseShanghaiDateString(endDate) - parseShanghaiDateString(startDate)) / (24 * 60 * 60 * 1000));
}
