type PosTag = 'n' | 'v' | 'prep';

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isAsciiLetter(ch: string | undefined): boolean {
  if (!ch) return false;
  const code = ch.charCodeAt(0);
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

export function parsePosTags(meaning: string | null | undefined): Set<PosTag> {
  const tags = new Set<PosTag>();
  const lower = (meaning || '').toLowerCase();

  if (/(^|[^a-z])prep\./.test(lower) || /(^|[^a-z])prep\b/.test(lower)) tags.add('prep');
  if (/(^|[^a-z])(v|vi|vt)\./.test(lower)) tags.add('v');
  if (/(^|[^a-z])n\./.test(lower)) tags.add('n');

  return tags;
}

export function pluralize(word: string): string {
  const lower = word.toLowerCase();
  if (lower.endsWith('y') && lower.length > 1) {
    const prev = lower[lower.length - 2];
    const isVowel = ['a', 'e', 'i', 'o', 'u'].includes(prev);
    if (!isVowel) return `${word.slice(0, -1)}ies`;
  }
  if (/(s|x|z|ch|sh)$/i.test(word)) return `${word}es`;
  return `${word}s`;
}

function buildVariantBases(raw: string): Set<string> {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z'-]/g, '');

  const cleaned = s.replace(/'s$/i, '').replace(/'$/i, '');
  const out = new Set<string>();

  const add = (v: string) => {
    const vv = v.trim();
    if (vv) out.add(vv);
  };

  add(cleaned);

  const pushStem = (base: string) => {
    add(base);
    if (/([a-z])\1$/.test(base)) add(base.slice(0, -1));
  };

  if (cleaned.endsWith('ies') && cleaned.length > 3) add(`${cleaned.slice(0, -3)}y`);
  if (cleaned.endsWith('ied') && cleaned.length > 3) add(`${cleaned.slice(0, -3)}y`);
  if (cleaned.endsWith('es') && cleaned.length > 2) add(cleaned.slice(0, -2));
  if (cleaned.endsWith('s') && cleaned.length > 1) add(cleaned.slice(0, -1));
  if (cleaned.endsWith('ing') && cleaned.length > 4) pushStem(cleaned.slice(0, -3));
  if (cleaned.endsWith('ed') && cleaned.length > 3) pushStem(cleaned.slice(0, -2));

  return out;
}

export function isVariantWord(candidate: string, target: string): boolean {
  const a = buildVariantBases(candidate);
  const b = buildVariantBases(target);
  for (const v of a) {
    if (b.has(v)) return true;
  }
  return false;
}

export function findBlankableMatches(sentence: string, baseWord: string): { index: number; len: number; answerText: string }[] {
  const word = baseWord.trim();
  if (!word) return [];

  const hasHyphen = word.includes('-');
  const forms = hasHyphen ? [word] : [word, pluralize(word)];
  const uniqueForms = Array.from(new Set(forms.filter(Boolean)));
  uniqueForms.sort((a, b) => b.length - a.length);

  const re = new RegExp(uniqueForms.map(escapeRegex).join('|'), 'gi');
  const matches: { index: number; len: number; answerText: string }[] = [];

  for (const m of sentence.matchAll(re)) {
    const index = m.index ?? -1;
    if (index < 0) continue;
    const answerText = m[0];
    const len = answerText.length;

    const prev = index > 0 ? sentence[index - 1] : undefined;
    const next = index + len < sentence.length ? sentence[index + len] : undefined;

    if (prev === '-' || next === '-') continue;
    if (prev === "'" || prev === '’') continue;

    if (hasHyphen) {
      if (isAsciiLetter(prev)) continue;
      if (isAsciiLetter(next)) continue;
      matches.push({ index, len, answerText });
      continue;
    }

    if (isAsciiLetter(prev)) continue;

    let suffixLen = 0;
    if (next === "'" || next === '’') {
      const afterApos = index + len + 1 < sentence.length ? sentence[index + len + 1] : undefined;
      if (afterApos && afterApos.toLowerCase() === 's') suffixLen = 2;
      else if (answerText.toLowerCase().endsWith('s')) suffixLen = 1;
    }

    const after = index + len + suffixLen < sentence.length ? sentence[index + len + suffixLen] : undefined;
    if (after === '-') continue;
    if (isAsciiLetter(after)) continue;
    if (!suffixLen && isAsciiLetter(next)) continue;

    matches.push({ index, len, answerText });
  }

  return matches;
}

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
