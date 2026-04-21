import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { findBlankableMatches, isVariantWord, parsePosTags, shuffleArray } from '@/lib/cloze-utils';
import { fetchAllFromSupabase } from '@/lib/supabase-fetch-all';

function getUserIdFromToken(token: string): number | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const userId = parseInt(decoded.split(':')[0]);
    return isNaN(userId) ? null : userId;
  } catch {
    return null;
  }
}

type WordRow = {
  id: number;
  word: string;
  phonetic: string | null;
  meaning: string | null;
  example_sentence: string | null;
  example_sentence_cn: string | null;
};

let cachedWords: WordRow[] | null = null;
let cachedAt = 0;

async function getWords(client: ReturnType<typeof getSupabaseClient>): Promise<WordRow[]> {
  const now = Date.now();
  if (cachedWords && now - cachedAt < 5 * 60 * 1000) return cachedWords;

  const baseQuery = client
    .from('words')
    .select('id, word, phonetic, meaning, example_sentence, example_sentence_cn')
    .not('example_sentence', 'is', null)
    .order('id', { ascending: true });

  const { data, error } = await fetchAllFromSupabase<WordRow>(baseQuery);
  if (error) throw new Error(error.message || 'Failed to fetch words');

  cachedWords = data as WordRow[];
  cachedAt = now;
  return cachedWords;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const userId = token ? getUserIdFromToken(token) : null;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '5')));
    const excludeWordIds = searchParams
      .get('excludeWordIds')
      ?.split(',')
      .map((v) => parseInt(v))
      .filter((v) => Number.isFinite(v)) || [];

    const excludeSet = new Set<number>(excludeWordIds);
    const allWords = await getWords(client);
    const pool = excludeSet.size ? allWords.filter((w) => !excludeSet.has(w.id)) : allWords;

    const questions: any[] = [];
    const attemptsLimit = Math.max(200, limit * 40);
    const shuffled = shuffleArray(pool);

    for (let i = 0; i < shuffled.length && questions.length < limit && i < attemptsLimit; i++) {
      const w = shuffled[i];
      if (!w.example_sentence) continue;

      const matches = findBlankableMatches(w.example_sentence, w.word);
      if (!matches.length) continue;

      const picked = matches[Math.floor(Math.random() * matches.length)];
      const questionSentence =
        w.example_sentence.slice(0, picked.index) +
        '_____' +
        w.example_sentence.slice(picked.index + picked.len);

      const correctAnswer = picked.answerText;

      const targetPos = parsePosTags(w.meaning);
      const candidates = pool.filter((d) => {
        if (d.id === w.id) return false;
        if (!d.word) return false;
        if (isVariantWord(d.word, w.word)) return false;
        if (d.word.toLowerCase() === correctAnswer.toLowerCase()) return false;
        if (!targetPos.size) return true;
        const dPos = parsePosTags(d.meaning);
        for (const t of targetPos) {
          if (dPos.has(t)) return true;
        }
        return false;
      });

      const distractors: string[] = [];
      const shuffledCandidates = shuffleArray(candidates);
      for (const d of shuffledCandidates) {
        if (distractors.length >= 3) break;
        const lw = d.word.toLowerCase();
        if (lw === correctAnswer.toLowerCase()) continue;
        if (distractors.some((x) => x.toLowerCase() === lw)) continue;
        distractors.push(d.word);
      }
      if (distractors.length < 3) continue;

      const options = shuffleArray([correctAnswer, ...distractors]);

      questions.push({
        id: w.id,
        word: w.word,
        phonetic: w.phonetic || '',
        meaning: w.meaning || '',
        question: questionSentence,
        options,
        correctAnswer,
        mode: 'cloze',
        example_sentence: w.example_sentence,
        example_sentence_cn: w.example_sentence_cn || undefined,
      });
    }

    return NextResponse.json({ questions, total: questions.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
