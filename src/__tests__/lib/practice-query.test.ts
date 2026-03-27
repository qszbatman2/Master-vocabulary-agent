import { describe, it, expect } from 'vitest';
import { buildPracticeQuery } from '@/lib/practice-query';

describe('buildPracticeQuery', () => {
  it('普通模式不应包含 filter 参数', () => {
    const q = buildPracticeQuery({ categoryId: 'all', filter: 'all', limit: 15 });
    const p = new URLSearchParams(q);
    expect(p.get('categoryId')).toBeNull();
    expect(p.get('filter')).toBeNull();
    expect(p.get('limit')).toBe('15');
  });

  it('主动收录模式应包含 filter=collected', () => {
    const q = buildPracticeQuery({ categoryId: 'all', filter: 'collected', limit: 15 });
    const p = new URLSearchParams(q);
    expect(p.get('filter')).toBe('collected');
  });

  it('支持排除与优先参数', () => {
    const q = buildPracticeQuery({
      categoryId: '12',
      filter: 'wrong_words',
      limit: 15,
      excludeWordIds: [1, 2],
      priorityWordIds: [3],
    });
    const p = new URLSearchParams(q);
    expect(p.get('categoryId')).toBe('12');
    expect(p.get('filter')).toBe('wrong_words');
    expect(p.get('excludeWordIds')).toBe('1,2');
    expect(p.get('priorityWordIds')).toBe('3');
  });
});

