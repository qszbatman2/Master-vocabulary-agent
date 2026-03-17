/**
 * 工具函数测试
 */

import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn 函数', () => {
  it('应该合并多个类名', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  it('应该处理条件类名', () => {
    const result = cn('base', false && 'hidden', true && 'active');
    expect(result).toContain('base');
    expect(result).toContain('active');
    expect(result).not.toContain('hidden');
  });

  it('应该合并 Tailwind 类名（去重）', () => {
    // twMerge 会智能合并冲突的 Tailwind 类
    const result = cn('px-2', 'px-4');
    expect(result).toBe('px-4');
  });

  it('应该处理对象类名', () => {
    const result = cn({ active: true, disabled: false });
    expect(result).toBe('active');
  });

  it('应该处理空值', () => {
    const result = cn('foo', null, undefined, 'bar');
    expect(result).toBe('foo bar');
  });

  it('应该处理数组类名', () => {
    const result = cn(['foo', 'bar'], 'baz');
    expect(result).toBe('foo bar baz');
  });

  it('应该处理混合类型', () => {
    const result = cn(
      'base',
      ['array-class'],
      { object: true, hidden: false },
      true && 'conditional'
    );
    expect(result).toContain('base');
    expect(result).toContain('array-class');
    expect(result).toContain('object');
    expect(result).toContain('conditional');
  });
});
