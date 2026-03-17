/**
 * 词形还原工具测试
 */

import { describe, it, expect, vi } from 'vitest';

// Mock lemmatizer 库
vi.mock('lemmatizer', () => ({
  __esModule: true,
  default: vi.fn((word: string) => {
    // 简单模拟 lemmatizer 行为
    const lemmas: Record<string, string> = {
      running: 'run',
      runs: 'run',
      cats: 'cat',
      dogs: 'dog',
      studied: 'study',
      working: 'work',
      worked: 'work',
      playing: 'play',
      played: 'play',
    };
    return lemmas[word] || word;
  }),
}));

// 导入被测试函数
import { lemmatizeLocal, batchLemmatize } from '@/lib/lemma-utils';

describe('lemmatizeLocal', () => {
  describe('不规则动词', () => {
    it('应该正确还原 went -> go', () => {
      expect(lemmatizeLocal('went')).toBe('go');
    });

    it('应该正确还原 was -> be', () => {
      expect(lemmatizeLocal('was')).toBe('be');
    });

    it('应该正确还原 were -> be', () => {
      expect(lemmatizeLocal('were')).toBe('be');
    });

    it('应该正确还原 had -> have', () => {
      expect(lemmatizeLocal('had')).toBe('have');
    });

    it('应该正确还原 did -> do', () => {
      expect(lemmatizeLocal('did')).toBe('do');
    });
  });

  describe('大小写处理', () => {
    it('应该正确处理大写输入', () => {
      expect(lemmatizeLocal('WENT')).toBe('go');
    });

    it('应该正确处理混合大小写', () => {
      expect(lemmatizeLocal('Went')).toBe('go');
    });
  });

  describe('规则变化', () => {
    it('应该处理 -ies -> -y (studies -> study)', () => {
      expect(lemmatizeLocal('studies')).toBe('study');
    });

    it('应该处理 -es -> -is (analyses -> analysis)', () => {
      expect(lemmatizeLocal('analyses')).toBe('analysis');
    });
  });

  describe('边界情况', () => {
    it('短词应该返回小写形式', () => {
      expect(lemmatizeLocal('the')).toBe('the');
    });

    it('未知词应该返回小写形式', () => {
      expect(lemmatizeLocal('unknownword')).toBe('unknownword');
    });

    it('空字符串应该返回空字符串', () => {
      expect(lemmatizeLocal('')).toBe('');
    });
  });
});

describe('batchLemmatize', () => {
  it('应该批量处理多个词', () => {
    const words = ['went', 'was', 'had', 'did'];
    const result = batchLemmatize(words);

    expect(result.get('went')).toBe('go');
    expect(result.get('was')).toBe('be');
    expect(result.get('had')).toBe('have');
    expect(result.get('did')).toBe('do');
  });

  it('应该返回 Map 类型', () => {
    const result = batchLemmatize(['test']);
    expect(result).toBeInstanceOf(Map);
  });

  it('空数组应该返回空 Map', () => {
    const result = batchLemmatize([]);
    expect(result.size).toBe(0);
  });
});
