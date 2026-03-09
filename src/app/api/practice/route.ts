import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');
    const mode = searchParams.get('mode') || 'en-to-zh'; // en-to-zh 或 zh-to-en
    const limit = parseInt(searchParams.get('limit') || '10');

    // 获取指定词库的所有单词
    let query = client
      .from('words')
      .select('*');

    if (categoryId && categoryId !== 'all') {
      query = query.eq('category_id', parseInt(categoryId));
    }

    const { data: allWords, error: wordsError } = await query;

    if (wordsError) {
      return NextResponse.json({ error: wordsError.message }, { status: 500 });
    }

    if (!allWords || allWords.length === 0) {
      return NextResponse.json({ error: 'No words found' }, { status: 404 });
    }

    // 随机选择指定数量的单词
    const shuffled = allWords.sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, Math.min(limit, shuffled.length));

    // 为每个单词生成选项
    const questions = selectedWords.map((word) => {
      // 获取其他单词作为干扰项
      const otherWords = allWords.filter((w) => w.id !== word.id);
      const shuffledOptions = otherWords.sort(() => Math.random() - 0.5).slice(0, 3);
      
      // 根据模式生成问题和选项
      let question: string;
      let options: string[];
      let correctAnswer: string;

      if (mode === 'en-to-zh') {
        question = word.word;
        correctAnswer = word.meaning;
        options = [
          word.meaning,
          ...shuffledOptions.map((w) => w.meaning),
        ];
      } else {
        question = word.meaning;
        correctAnswer = word.word;
        options = [
          word.word,
          ...shuffledOptions.map((w) => w.word),
        ];
      }

      // 打乱选项顺序
      const shuffledFinal = options.sort(() => Math.random() - 0.5);

      return {
        id: word.id,
        word: word.word,
        phonetic: word.phonetic,
        meaning: word.meaning,
        example_sentence: word.example_sentence,
        question,
        options: shuffledFinal,
        correctAnswer,
        mode,
      };
    });

    return NextResponse.json({
      questions,
      total: questions.length,
    });
  } catch (error) {
    console.error('Error generating practice questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate practice questions' },
      { status: 500 }
    );
  }
}
