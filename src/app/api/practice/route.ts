import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 解析 token 获取用户 ID
function getUserIdFromToken(token: string): number | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const userId = parseInt(decoded.split(':')[0]);
    return isNaN(userId) ? null : userId;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const userId = token ? getUserIdFromToken(token) : null;

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

    // 如果用户已登录，排除已掌握的单词
    let availableWords = allWords;
    if (userId) {
      const { data: masteredStatus } = await client
        .from('user_word_status')
        .select('word_id')
        .eq('user_id', userId)
        .eq('is_mastered', true);

      const masteredWordIds = new Set(masteredStatus?.map(s => s.word_id) || []);
      availableWords = allWords.filter(w => !masteredWordIds.has(w.id));
    }

    if (availableWords.length === 0) {
      return NextResponse.json({ 
        questions: [], 
        total: 0,
        message: '恭喜！你已经掌握了所有单词！' 
      });
    }

    // 随机选择指定数量的单词
    const shuffled = availableWords.sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, Math.min(limit, shuffled.length));

    // 为每个单词生成选项，并随机选择模式
    const questions = selectedWords.map((word) => {
      // 获取其他单词作为干扰项
      const otherWords = availableWords.filter((w) => w.id !== word.id);
      const shuffledOptions = otherWords.sort(() => Math.random() - 0.5).slice(0, 3);
      
      // 随机选择模式：en-to-zh 或 zh-to-en
      const mode = Math.random() > 0.5 ? 'en-to-zh' : 'zh-to-en';
      
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
      remainingWords: availableWords.length,
    });
  } catch (error) {
    console.error('Error generating practice questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate practice questions' },
      { status: 500 }
    );
  }
}
