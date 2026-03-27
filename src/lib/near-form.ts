type NearFormEntry = {
  id?: number;
  word: string;
  norm: string;
  len: number;
  first: string;
  _bigrams?: Set<string>;
};

export type NearFormIndex = {
  entries: NearFormEntry[];
  byBucket: Map<string, NearFormEntry[]>;
};

type NearFormQueryOptions = {
  topK?: number;
  minScore?: number;
  maxLenDiff?: number;
  expandIfLessThan?: number;
  excludeIds?: Set<number>;
  excludeWordsLower?: Set<string>;
};

const CONFUSABLE_GROUPS: ReadonlyArray<ReadonlySet<string>> = [
  new Set(['i', 'l']),
  new Set(['u', 'v']),
  new Set(['c', 'e']),
  new Set(['m', 'n']),
  new Set(['a', 'e']),
  new Set(['o', 'q']),
];

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

export function normalizeSpelling(input: string): string {
  return (input || '')
    .trim()
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z]/g, '');
}

function isConfusableChar(a: string, b: string): boolean {
  if (a === b) return true;
  for (const g of CONFUSABLE_GROUPS) {
    if (g.has(a) && g.has(b)) return true;
  }
  return false;
}

function substitutionCost(a: string, b: string): number {
  if (a === b) return 0;
  if (isConfusableChar(a, b)) return 0.25;
  const av = VOWELS.has(a);
  const bv = VOWELS.has(b);
  if (av && bv) return 0.6;
  return 1;
}

function weightedDamerauLevenshtein(a: string, b: string): number {
  const n = a.length;
  const m = b.length;
  if (!n) return m;
  if (!m) return n;

  let prevPrev = new Array<number>(m + 1).fill(0);
  let prev = new Array<number>(m + 1);
  for (let j = 0; j <= m; j++) prev[j] = j;

  for (let i = 1; i <= n; i++) {
    const curr = new Array<number>(m + 1);
    curr[0] = i;
    for (let j = 1; j <= m; j++) {
      const del = prev[j] + 1;
      const ins = curr[j - 1] + 1;
      const sub = prev[j - 1] + substitutionCost(a[i - 1], b[j - 1]);
      let best = Math.min(del, ins, sub);

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, prevPrev[j - 2] + 0.5);
      }

      curr[j] = best;
    }
    prevPrev = prev;
    prev = curr;
  }

  return prev[m];
}

function bigramSet(norm: string): Set<string> {
  const set = new Set<string>();
  if (norm.length < 2) return set;
  for (let i = 0; i + 1 < norm.length; i++) set.add(norm.slice(i, i + 2));
  return set;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size && !b.size) return 0;
  let small = a;
  let large = b;
  if (a.size > b.size) {
    small = b;
    large = a;
  }
  let inter = 0;
  for (const x of small) if (large.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

function multisetJaccardChars(a: string, b: string): number {
  const ca = new Array<number>(26).fill(0);
  const cb = new Array<number>(26).fill(0);
  for (let i = 0; i < a.length; i++) {
    const c = a.charCodeAt(i) - 97;
    if (c >= 0 && c < 26) ca[c]++;
  }
  for (let i = 0; i < b.length; i++) {
    const c = b.charCodeAt(i) - 97;
    if (c >= 0 && c < 26) cb[c]++;
  }
  let inter = 0;
  let uni = 0;
  for (let i = 0; i < 26; i++) {
    inter += Math.min(ca[i], cb[i]);
    uni += Math.max(ca[i], cb[i]);
  }
  return uni ? inter / uni : 0;
}

export function nearFormScore(a: string, b: string): number {
  const na = normalizeSpelling(a);
  const nb = normalizeSpelling(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;

  const lenMax = Math.max(na.length, nb.length);
  const d = weightedDamerauLevenshtein(na, nb);
  const sEdit = Math.max(0, 1 - d / lenMax);

  const sChar = multisetJaccardChars(na, nb);
  const sBg = jaccard(bigramSet(na), bigramSet(nb));
  const score = 0.7 * sEdit + 0.2 * sChar + 0.1 * sBg;
  return Math.max(0, Math.min(1, score));
}

export function buildNearFormIndex(words: Array<{ id?: number; word: string }>): NearFormIndex {
  const entries: NearFormEntry[] = [];
  const byBucket = new Map<string, NearFormEntry[]>();

  for (const w of words) {
    const norm = normalizeSpelling(w.word);
    if (!norm) continue;
    const entry: NearFormEntry = {
      id: w.id,
      word: w.word,
      norm,
      len: norm.length,
      first: norm[0] || '',
    };
    entries.push(entry);
    const key = `${entry.first}|${entry.len}`;
    const arr = byBucket.get(key);
    if (arr) arr.push(entry);
    else byBucket.set(key, [entry]);
  }

  return { entries, byBucket };
}

export function queryNearFormIndex(target: string, index: NearFormIndex, opts: NearFormQueryOptions = {}): NearFormEntry[] {
  const topK = Math.max(1, opts.topK ?? 50);
  const minScore = opts.minScore ?? 0.72;
  const maxLenDiff = Math.max(0, opts.maxLenDiff ?? 2);
  const expandIfLessThan = Math.max(0, opts.expandIfLessThan ?? 30);

  const norm = normalizeSpelling(target);
  if (!norm) return [];

  const len = norm.length;
  const first = norm[0] || '';

  const candidates = new Map<string, NearFormEntry>();
  const push = (e: NearFormEntry) => {
    if (opts.excludeIds && e.id != null && opts.excludeIds.has(e.id)) return;
    if (opts.excludeWordsLower && opts.excludeWordsLower.has(e.word.toLowerCase())) return;
    if (e.norm === norm) return;
    const k = e.id != null ? `id:${e.id}` : `w:${e.word.toLowerCase()}`;
    if (!candidates.has(k)) candidates.set(k, e);
  };

  const collect = (sameFirstOnly: boolean) => {
    if (sameFirstOnly) {
      for (let dl = -maxLenDiff; dl <= maxLenDiff; dl++) {
        const l = len + dl;
        if (l <= 0) continue;
        const bucket = index.byBucket.get(`${first}|${l}`);
        if (!bucket) continue;
        for (const e of bucket) push(e);
      }
      return;
    }

    for (let dl = -maxLenDiff; dl <= maxLenDiff; dl++) {
      const l = len + dl;
      if (l <= 0) continue;
      for (let c = 97; c <= 122; c++) {
        const bucket = index.byBucket.get(`${String.fromCharCode(c)}|${l}`);
        if (!bucket) continue;
        for (const e of bucket) push(e);
      }
    }
  };

  collect(true);
  if (candidates.size < expandIfLessThan) collect(false);

  const scored: Array<{ e: NearFormEntry; s: number }> = [];
  for (const e of candidates.values()) {
    if (Math.abs(e.len - len) > maxLenDiff) continue;
    const s = nearFormScore(norm, e.norm);
    if (s >= minScore) scored.push({ e, s });
  }

  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, topK).map((x) => x.e);
}

export function pickNearFormDistractors(
  correct: string,
  index: NearFormIndex,
  opts: { k?: number; minScore?: number; excludeIds?: Set<number>; excludeWordsLower?: Set<string> } = {}
): string[] {
  const k = Math.max(1, opts.k ?? 3);
  const minScore = opts.minScore ?? 0.74;
  const list = queryNearFormIndex(correct, index, {
    topK: Math.max(50, k * 30),
    minScore,
    maxLenDiff: 2,
    expandIfLessThan: 40,
    excludeIds: opts.excludeIds,
    excludeWordsLower: opts.excludeWordsLower,
  });

  const out: string[] = [];
  const used = new Set<string>([normalizeSpelling(correct)]);
  for (const e of list) {
    const n = normalizeSpelling(e.word);
    if (!n || used.has(n)) continue;
    used.add(n);
    out.push(e.word);
    if (out.length >= k) break;
  }
  return out;
}
