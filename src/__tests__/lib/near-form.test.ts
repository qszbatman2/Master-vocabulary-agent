import { describe, it, expect } from 'vitest';
import { buildNearFormIndex, nearFormScore, normalizeSpelling, queryNearFormIndex } from '@/lib/near-form';

describe('near-form', () => {
  it('normalizeSpelling should keep only a-z and lowercase', () => {
    expect(normalizeSpelling("Runner's")).toBe('runners');
    expect(normalizeSpelling('Co-operate')).toBe('cooperate');
    expect(normalizeSpelling('  A.B! ')).toBe('ab');
  });

  it('nearFormScore should be high for adjacent transposition', () => {
    expect(nearFormScore('from', 'form')).toBeGreaterThan(0.8);
  });

  it('nearFormScore should be higher for confusable chars than unrelated', () => {
    const confusable = nearFormScore('manner', 'nanner');
    const unrelated = nearFormScore('manner', 'people');
    expect(confusable).toBeGreaterThan(unrelated);
  });

  it('queryNearFormIndex should return close matches', () => {
    const idx = buildNearFormIndex([
      { id: 1, word: 'form' },
      { id: 2, word: 'from' },
      { id: 3, word: 'farm' },
      { id: 4, word: 'cat' },
    ]);
    const results = queryNearFormIndex('from', idx, { topK: 10, minScore: 0.7 });
    const words = results.map((x) => x.word.toLowerCase());
    expect(words.includes('form')).toBe(true);
    expect(words.includes('cat')).toBe(false);
  });
});
