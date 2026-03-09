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
    const filter = searchParams.get('filter'); // 'wrong_words' - 错题集
    const excludeWordIds = searchParams.get('excludeWordIds')?.split(',').map(Number).filter(Boolean) || [];
    const priorityWordIds = searchParams.get('priorityWordIds')?.split(',').map(Number).filter(Boolean) || [];
    
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const userId = token ? getUserIdFromToken(token) : null;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // 获取用户掌握状态
    const { data: userStatusData } = await client
      .from('user_word_status')
      .select('word_id, is_mastered, last_wrong_at')
      .eq('user_id', userId);

    const statusMap = new Map(userStatusData?.map(s => [s.word_id, s]) || []);

    // 根据筛选条件过滤
    let availableWords = allWords;

    // 错题集：最近7天有错误记录的单词
    if (filter === 'wrong_words') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      availableWords = allWords.filter(w => {
        const status = statusMap.get(w.id);
        if (!status?.last_wrong_at) return false;
        return new Date(status.last_wrong_at) >= sevenDaysAgo;
      });
    } else {
      // 普通模式：排除已掌握的单词
      availableWords = allWords.filter(w => {
        const status = statusMap.get(w.id);
        return !status?.is_mastered;
      });
    }

    // 排除本轮已成功的单词
    if (excludeWordIds.length > 0) {
      const excludeSet = new Set(excludeWordIds);
      availableWords = availableWords.filter(w => !excludeSet.has(w.id));
    }

    if (availableWords.length === 0) {
      return NextResponse.json({ 
        questions: [], 
        total: 0,
        remainingWords: 0,
        message: filter === 'wrong_words' 
          ? '恭喜！错题集已清空！' 
          : '恭喜！你已经掌握了所有单词！' 
      });
    }

    // 优先选择需要复习的错题（优先词列表）
    let selectedWords;
    if (priorityWordIds.length > 0) {
      const prioritySet = new Set(priorityWordIds);
      const priorityWords = availableWords.filter(w => prioritySet.has(w.id));
      const otherWords = availableWords.filter(w => !prioritySet.has(w.id));
      
      // 随机打乱两组
      const shuffledPriority = priorityWords.sort(() => Math.random() - 0.5);
      const shuffledOther = otherWords.sort(() => Math.random() - 0.5);
      
      // 合并，优先词在前
      selectedWords = [...shuffledPriority, ...shuffledOther].slice(0, limit);
    } else {
      // 随机选择指定数量的单词
      const shuffled = availableWords.sort(() => Math.random() - 0.5);
      selectedWords = shuffled.slice(0, Math.min(limit, shuffled.length));
    }

    // 为每个单词生成选项，并随机选择模式
    const questions = selectedWords.map((word) => {
      // 获取其他单词作为干扰项（从所有单词中选，不只是未掌握的）
      const otherWords = allWords.filter((w) => w.id !== word.id);
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
        example_sentence_cn: word.example_sentence_cn,
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
