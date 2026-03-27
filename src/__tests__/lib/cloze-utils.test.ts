import { describe, it, expect } from 'vitest';
import { findBlankableMatches, isVariantWord, parsePosTags } from '@/lib/cloze-utils';

describe('cloze-utils', () => {
  it("允许 student 在 student's 里被挖空", () => {
    const sentence = "The student's book is new.";
    const matches = findBlankableMatches(sentence, 'student');
    expect(matches.length).toBeGreaterThan(0);
    const picked = matches[0];
    const q = sentence.slice(0, picked.index) + '_____' + sentence.slice(picked.index + picked.len);
    expect(q).toBe("The _____'s book is new.");
    expect(picked.answerText.toLowerCase()).toBe('student');
  });

  it("不允许 known 在 well-known 里被单挖", () => {
    const sentence = 'He is well-known.';
    const matches = findBlankableMatches(sentence, 'known');
    expect(matches.length).toBe(0);
  });

  it('允许复数匹配', () => {
    const sentence = 'Two dogs are here.';
    const matches = findBlankableMatches(sentence, 'dog');
    expect(matches.some((m) => m.answerText.toLowerCase() === 'dogs')).toBe(true);
  });

  it('支持大小写不敏感匹配', () => {
    const sentence = 'An apple a day keeps the doctor away.';
    const matches = findBlankableMatches(sentence, 'Apple');
    expect(matches.some((m) => m.answerText.toLowerCase() === 'apple')).toBe(true);
  });

  it('支持连字符单词整体匹配', () => {
    const sentence = 'He is well-known.';
    const matches = findBlankableMatches(sentence, 'well-known');
    expect(matches.some((m) => m.answerText.toLowerCase() === 'well-known')).toBe(true);
  });

  it('变体判定能排除大小写与常见词尾变化', () => {
    expect(isVariantWord('Student', 'student')).toBe(true);
    expect(isVariantWord('students', 'student')).toBe(true);
    expect(isVariantWord('studied', 'study')).toBe(true);
    expect(isVariantWord('running', 'run')).toBe(true);
  });

  it('词性解析支持多词性包含', () => {
    const tags1 = parsePosTags('n./v. 测试');
    expect(tags1.has('n')).toBe(true);
    expect(tags1.has('v')).toBe(true);

    const tags2 = parsePosTags('adv./prep. 测试');
    expect(tags2.has('prep')).toBe(true);
    expect(tags2.has('v')).toBe(false);
  });
});
