import { describe, it, expect } from 'vitest';
import { addClampedDurationSeconds, sanitizeDurationSeconds, MAX_DAILY_SECONDS, MAX_INCREMENT_SECONDS } from '@/lib/duration';

describe('duration', () => {
  it('sanitizeDurationSeconds 应该处理非数字与负数', () => {
    expect(sanitizeDurationSeconds(undefined)).toBe(0);
    expect(sanitizeDurationSeconds('x')).toBe(0);
    expect(sanitizeDurationSeconds(-1)).toBe(0);
    expect(sanitizeDurationSeconds(0)).toBe(0);
  });

  it('sanitizeDurationSeconds 应该向下取整并限幅', () => {
    expect(sanitizeDurationSeconds(12.9)).toBe(12);
    expect(sanitizeDurationSeconds(MAX_INCREMENT_SECONDS + 1)).toBe(MAX_INCREMENT_SECONDS);
  });

  it('addClampedDurationSeconds 应该对增量与当日上限做保护', () => {
    expect(addClampedDurationSeconds(10, 5)).toBe(15);
    expect(addClampedDurationSeconds(10, MAX_INCREMENT_SECONDS + 100)).toBe(10 + MAX_INCREMENT_SECONDS);
    expect(addClampedDurationSeconds(MAX_DAILY_SECONDS - 10, 100)).toBe(MAX_DAILY_SECONDS);
  });
});
