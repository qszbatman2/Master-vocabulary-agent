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

    // Fisher-Yates 洗牌算法 - 真正均匀随机
    function shuffleArray<T>(array: T[]): T[] {
      const result = [...array];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    }

    // 获取指定词库的所有单词
    let query = client
      .from('words')
      .select('*');

    if (categoryId && categoryId !== 'all') {
      query = query.eq('category_id', parseInt(categoryId));
    }

    const { data, error: wordsError } = await query;

    if (wordsError) {
      return NextResponse.json({ error: wordsError.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No words found' }, { status: 404 });
    }

    // 立即洗牌，避免数据库默认排序（通常按 id/字母顺序）导致集中
    const allWords = shuffleArray(data || []);

    // 获取用户掌握状态 - 增加 last_correct_date 字段
    const { data: userStatusData } = await client
      .from('user_word_status')
      .select('word_id, is_mastered, last_wrong_at, last_correct_date')
      .eq('user_id', userId);

    const statusMap = new Map(userStatusData?.map(s => [s.word_id, s]) || []);
    
    // 获取今天的日期（上海时区）
    const now = new Date();
    const shanghaiTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const today = shanghaiTime.toISOString().split('T')[0];

    // 构建单词到所有 id 的映射（同一个单词可能在多个分类中）
    const wordToIds = new Map<string, number[]>();
    allWords.forEach(w => {
      const ids = wordToIds.get(w.word) || [];
      ids.push(w.id);
      wordToIds.set(w.word, ids);
    });

    // 检查一个单词是否已被掌握（任意一个 id 被掌握即算掌握）
    const isWordMastered = (word: string): boolean => {
      const ids = wordToIds.get(word) || [];
      return ids.some(id => statusMap.get(id)?.is_mastered);
    };

    // 检查一个单词今天是否已答对（任意一个 id 今天答对即算已答对）
    const isWordCorrectToday = (word: string): boolean => {
      const ids = wordToIds.get(word) || [];
      return ids.some(id => statusMap.get(id)?.last_correct_date === today);
    };

    // 检查一个单词是否有错误记录（任意一个 id 有错误即算有错误）
    const hasWordWrongRecord = (word: string, sevenDaysAgo: Date): boolean => {
      const ids = wordToIds.get(word) || [];
      return ids.some(id => {
        const status = statusMap.get(id);
        if (!status?.last_wrong_at) return false;
        return new Date(status.last_wrong_at) >= sevenDaysAgo;
      });
    };

    // 去重后的单词列表（按 word 字段去重）
    const uniqueWords: Map<string, typeof allWords[0]> = new Map();
    allWords.forEach(w => {
      if (!uniqueWords.has(w.word)) {
        uniqueWords.set(w.word, w);
      }
    });

    // 根据筛选条件过滤
    let availableWords: typeof allWords = [];

    // 错题集：最近7天有错误记录的单词
    if (filter === 'wrong_words') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      uniqueWords.forEach((w, word) => {
        // 排除已掌握的单词和今天已答对的单词
        if (hasWordWrongRecord(word, sevenDaysAgo) && !isWordMastered(word) && !isWordCorrectToday(word)) {
          availableWords.push(w);
        }
      });
    } else {
      // 普通模式：排除已掌握的单词和今天已答对的单词
      uniqueWords.forEach((w, word) => {
        if (!isWordMastered(word) && !isWordCorrectToday(word)) {
          availableWords.push(w);
        }
      });
    }

    // 排除本轮已成功的单词（通过 id 转换为 word 字段来排除）
    if (excludeWordIds.length > 0) {
      const excludeSet = new Set(excludeWordIds);
      // 获取所有需要排除的单词文本
      const excludeWords = new Set<string>();
      allWords.forEach(w => {
        if (excludeSet.has(w.id)) {
          excludeWords.add(w.word);
        }
      });
      availableWords = availableWords.filter(w => !excludeWords.has(w.word));
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
      // 获取所有需要优先的单词文本
      const priorityWords = new Set<string>();
      allWords.forEach(w => {
        if (prioritySet.has(w.id)) {
          priorityWords.add(w.word);
        }
      });
      
      const priorityAvailable = availableWords.filter(w => priorityWords.has(w.word));
      const otherWords = availableWords.filter(w => !priorityWords.has(w.word));
      
      // 使用 Fisher-Yates 洗牌
      const shuffledPriority = shuffleArray(priorityAvailable);
      const shuffledOther = shuffleArray(otherWords);
      
      // 合并，优先词在前
      selectedWords = [...shuffledPriority, ...shuffledOther].slice(0, limit);
    } else {
      // 使用 Fisher-Yates 洗牌选择指定数量的单词
      const shuffled = shuffleArray(availableWords);
      selectedWords = shuffled.slice(0, Math.min(limit, shuffled.length));
    }

    // 为每个单词生成选项，并随机选择模式
    const questions = selectedWords.map((word) => {
      // 获取其他单词作为干扰项（从所有单词中选，不只是未掌握的）
      // 按单词文本去重，避免同一单词的多个记录导致选项重复
      const otherWordsMap = new Map<string, typeof allWords[0]>();
      allWords.forEach((w) => {
        if (w.word !== word.word && !otherWordsMap.has(w.word)) {
          otherWordsMap.set(w.word, w);
        }
      });
      const otherWords = Array.from(otherWordsMap.values());
      const shuffledOptions = shuffleArray(otherWords).slice(0, 3);
      
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

      // 最终去重确保选项唯一
      const uniqueOptions = [...new Set(options)];
      
      // 如果去重后选项不足4个，从 otherWords 中补充
      if (uniqueOptions.length < 4) {
        const usedValues = new Set(uniqueOptions);
        for (const w of otherWords) {
          if (uniqueOptions.length >= 4) break;
          const value = mode === 'en-to-zh' ? w.meaning : w.word;
          if (!usedValues.has(value)) {
            uniqueOptions.push(value);
            usedValues.add(value);
          }
        }
      }

      // 打乱选项顺序
      const shuffledFinal = shuffleArray(uniqueOptions);

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
