/**
 * 核心业务逻辑测试 - 掌握判定算法
 * 
 * 测试场景：
 * 1. 普通单词答对 - 每天1次有效答对
 * 2. 错题连续答对 - 需要3次才算1次有效
 * 3. 跨天判定 - 只有不同天的答对才计入
 * 4. 掌握判定 - 4天有效答对即掌握
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============ 核心逻辑函数（从 route.ts 提取，便于测试）============

/**
 * 获取今天的日期字符串 (YYYY-MM-DD) - 上海时区
 */
export function getTodayDateString(): string {
  const now = new Date();
  const shanghaiTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return shanghaiTime.toISOString().split('T')[0];
}

/**
 * 检查日期是否是今天
 */
export function isToday(dateString: string | null): boolean {
  if (!dateString) return false;
  return dateString === getTodayDateString();
}

/**
 * 计算答题后的掌握状态
 */
export interface AnswerContext {
  isCorrect: boolean;
  isRoundWrongWord: boolean;
  existingStatus: {
    dailyCorrectCount: number;
    lastCorrectDate: string | null;
    roundConsecutiveCorrect: number;
    isMastered: boolean;
  } | null;
}

export interface AnswerResult {
  dailyCorrectCount: number;
  lastCorrectDate: string | null;
  roundConsecutiveCorrect: number;
  isMastered: boolean;
  validCorrectRecorded: boolean;
}

export function calculateMasteryState(context: AnswerContext): AnswerResult {
  const { isCorrect, isRoundWrongWord, existingStatus } = context;
  const today = getTodayDateString();

  // 初始化
  let dailyCorrectCount = existingStatus?.dailyCorrectCount || 0;
  let lastCorrectDate = existingStatus?.lastCorrectDate || null;
  let roundConsecutiveCorrect = existingStatus?.roundConsecutiveCorrect || 0;
  let isMastered = existingStatus?.isMastered || false;
  let validCorrectRecorded = false;

  if (isCorrect) {
    if (isRoundWrongWord) {
      // 错题：连续对3次才算1次有效
      roundConsecutiveCorrect += 1;

      if (roundConsecutiveCorrect >= 3) {
        roundConsecutiveCorrect = 0;

        if (!isToday(lastCorrectDate)) {
          dailyCorrectCount += 1;
          lastCorrectDate = today;
          validCorrectRecorded = true;
        }
      }
    } else {
      // 普通单词：每天最多1次有效答对
      if (!isToday(lastCorrectDate)) {
        dailyCorrectCount += 1;
        lastCorrectDate = today;
        validCorrectRecorded = true;
      }
      roundConsecutiveCorrect = 0;
    }

    // 检查掌握条件
    if (dailyCorrectCount >= 4) {
      isMastered = true;
    }
  } else {
    // 答错：重置本轮连续计数
    roundConsecutiveCorrect = 0;
  }

  return {
    dailyCorrectCount,
    lastCorrectDate,
    roundConsecutiveCorrect,
    isMastered,
    validCorrectRecorded,
  };
}

// ============ 测试用例 ============

describe('掌握判定逻辑', () => {
  const today = getTodayDateString();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  })();

  describe('普通单词答对', () => {
    it('首次答对应该记录有效答对', () => {
      const result = calculateMasteryState({
        isCorrect: true,
        isRoundWrongWord: false,
        existingStatus: null,
      });

      expect(result.dailyCorrectCount).toBe(1);
      expect(result.lastCorrectDate).toBe(today);
      expect(result.validCorrectRecorded).toBe(true);
      expect(result.isMastered).toBe(false);
    });

    it('同一天重复答对不应重复记录', () => {
      const result = calculateMasteryState({
        isCorrect: true,
        isRoundWrongWord: false,
        existingStatus: {
          dailyCorrectCount: 1,
          lastCorrectDate: today,
          roundConsecutiveCorrect: 0,
          isMastered: false,
        },
      });

      expect(result.dailyCorrectCount).toBe(1); // 不变
      expect(result.validCorrectRecorded).toBe(false);
    });

    it('跨天答对应该累加', () => {
      const result = calculateMasteryState({
        isCorrect: true,
        isRoundWrongWord: false,
        existingStatus: {
          dailyCorrectCount: 1,
          lastCorrectDate: yesterday,
          roundConsecutiveCorrect: 0,
          isMastered: false,
        },
      });

      expect(result.dailyCorrectCount).toBe(2);
      expect(result.validCorrectRecorded).toBe(true);
    });
  });

  describe('错题连续答对', () => {
    it('错题答对1次不应记录有效答对', () => {
      const result = calculateMasteryState({
        isCorrect: true,
        isRoundWrongWord: true,
        existingStatus: null,
      });

      expect(result.dailyCorrectCount).toBe(0);
      expect(result.roundConsecutiveCorrect).toBe(1);
      expect(result.validCorrectRecorded).toBe(false);
    });

    it('错题答对2次不应记录有效答对', () => {
      const result = calculateMasteryState({
        isCorrect: true,
        isRoundWrongWord: true,
        existingStatus: {
          dailyCorrectCount: 0,
          lastCorrectDate: null,
          roundConsecutiveCorrect: 1,
          isMastered: false,
        },
      });

      expect(result.dailyCorrectCount).toBe(0);
      expect(result.roundConsecutiveCorrect).toBe(2);
      expect(result.validCorrectRecorded).toBe(false);
    });

    it('错题连续答对3次应该记录有效答对', () => {
      const result = calculateMasteryState({
        isCorrect: true,
        isRoundWrongWord: true,
        existingStatus: {
          dailyCorrectCount: 0,
          lastCorrectDate: null,
          roundConsecutiveCorrect: 2,
          isMastered: false,
        },
      });

      expect(result.dailyCorrectCount).toBe(1);
      expect(result.roundConsecutiveCorrect).toBe(0); // 重置
      expect(result.validCorrectRecorded).toBe(true);
    });

    it('错题中途答错应该重置连续计数', () => {
      const result = calculateMasteryState({
        isCorrect: false,
        isRoundWrongWord: true,
        existingStatus: {
          dailyCorrectCount: 0,
          lastCorrectDate: null,
          roundConsecutiveCorrect: 2,
          isMastered: false,
        },
      });

      expect(result.roundConsecutiveCorrect).toBe(0);
      expect(result.dailyCorrectCount).toBe(0);
    });
  });

  describe('掌握判定', () => {
    it('第4天有效答对应该标记为掌握', () => {
      const result = calculateMasteryState({
        isCorrect: true,
        isRoundWrongWord: false,
        existingStatus: {
          dailyCorrectCount: 3,
          lastCorrectDate: yesterday,
          roundConsecutiveCorrect: 0,
          isMastered: false,
        },
      });

      expect(result.dailyCorrectCount).toBe(4);
      expect(result.isMastered).toBe(true);
    });

    it('已掌握的单词不应被取消', () => {
      const result = calculateMasteryState({
        isCorrect: false,
        isRoundWrongWord: false,
        existingStatus: {
          dailyCorrectCount: 4,
          lastCorrectDate: yesterday,
          roundConsecutiveCorrect: 0,
          isMastered: true,
        },
      });

      expect(result.isMastered).toBe(true); // 保持掌握
    });
  });
});

describe('日期工具函数', () => {
  describe('getTodayDateString', () => {
    it('应该返回 YYYY-MM-DD 格式的日期', () => {
      const result = getTodayDateString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('isToday', () => {
    it('今天的日期应该返回 true', () => {
      const today = getTodayDateString();
      expect(isToday(today)).toBe(true);
    });

    it('null 应该返回 false', () => {
      expect(isToday(null)).toBe(false);
    });

    it('昨天的日期应该返回 false', () => {
      const yesterday = (() => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
      })();
      expect(isToday(yesterday)).toBe(false);
    });
  });
});
