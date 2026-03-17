/**
 * Fisher-Yates 洗牌算法测试
 * 
 * 验证：
 * 1. 输出是输入的排列（不增减元素）
 * 2. 结果随机性（多次洗牌结果不同）
 * 3. 边界条件（空数组、单元素）
 */

import { describe, it, expect } from 'vitest';

/**
 * Fisher-Yates 洗牌算法
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

describe('Fisher-Yates 洗牌算法', () => {
  describe('基本功能', () => {
    it('应该返回原数组的排列', () => {
      const input = [1, 2, 3, 4, 5];
      const result = shuffleArray(input);

      // 长度相同
      expect(result.length).toBe(input.length);

      // 包含所有原元素
      expect(result.sort()).toEqual(input.sort());
    });

    it('不应该修改原数组', () => {
      const input = [1, 2, 3, 4, 5];
      const original = [...input];
      shuffleArray(input);

      expect(input).toEqual(original);
    });
  });

  describe('随机性验证', () => {
    it('多次洗牌结果应该不同（大概率）', () => {
      const input = Array.from({ length: 100 }, (_, i) => i);

      const results = new Set<string>();
      for (let i = 0; i < 10; i++) {
        results.add(JSON.stringify(shuffleArray(input)));
      }

      // 10次洗锁至少应该有8次不同的结果
      expect(results.size).toBeGreaterThanOrEqual(8);
    });

    it('每个位置应该均匀分布（统计测试）', () => {
      const input = [1, 2, 3, 4, 5];
      const positionCounts: Record<number, number[]> = {
        1: [0, 0, 0, 0, 0],
        2: [0, 0, 0, 0, 0],
        3: [0, 0, 0, 0, 0],
        4: [0, 0, 0, 0, 0],
        5: [0, 0, 0, 0, 0],
      };

      const iterations = 1000;
      for (let i = 0; i < iterations; i++) {
        const shuffled = shuffleArray(input);
        shuffled.forEach((val, pos) => {
          positionCounts[val][pos]++;
        });
      }

      // 每个元素在每个位置出现概率应该约为 20%
      const expectedCount = iterations / 5;
      const tolerance = expectedCount * 0.2; // 20% 容差

      for (const val of [1, 2, 3, 4, 5]) {
        for (let pos = 0; pos < 5; pos++) {
          const count = positionCounts[val][pos];
          expect(count).toBeGreaterThan(expectedCount - tolerance);
          expect(count).toBeLessThan(expectedCount + tolerance);
        }
      }
    });
  });

  describe('边界条件', () => {
    it('空数组应该返回空数组', () => {
      expect(shuffleArray([])).toEqual([]);
    });

    it('单元素数组应该返回相同数组', () => {
      expect(shuffleArray([1])).toEqual([1]);
    });

    it('双元素数组应该返回有效排列', () => {
      const input = [1, 2];
      const result = shuffleArray(input);
      expect(result.length).toBe(2);
      expect(result.includes(1)).toBe(true);
      expect(result.includes(2)).toBe(true);
    });
  });

  describe('类型支持', () => {
    it('应该支持字符串数组', () => {
      const input = ['a', 'b', 'c', 'd'];
      const result = shuffleArray(input);
      expect(result.sort()).toEqual(input.sort());
    });

    it('应该支持对象数组', () => {
      const input = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = shuffleArray(input);
      expect(result.map((x) => x.id).sort()).toEqual([1, 2, 3]);
    });
  });
});
