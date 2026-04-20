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
