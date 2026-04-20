import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { buildNearFormIndex, queryNearFormIndex, normalizeSpelling } from '@/lib/near-form';
import { getShanghaiDateWithOffset, getTodayShanghaiDateString } from '@/lib/shanghai-date';

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
    const distractorMode = searchParams.get('distractorMode');
    const mode = searchParams.get('mode'); // 'normal', 'near_form', 'cloze'
    const excludeWordIds = searchParams.get('excludeWordIds')?.split(',').map(Number).filter(Boolean) || [];
    const priorityWordIds = searchParams.get('priorityWordIds')?.split(',').map(Number).filter(Boolean) || [];
    
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const userId = token ? getUserIdFromToken(token) : null;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 如果是挖词填空模式，调用 cloze 接口
    if (mode === 'cloze') {
      try {
        const clozeUrl = new URL(request.nextUrl.origin + '/api/cloze');
        clozeUrl.searchParams.set('limit', '1');
        if (excludeWordIds.length > 0) {
          clozeUrl.searchParams.set('excludeWordIds', excludeWordIds.join(','));
        }

        const clozeResponse = await fetch(clozeUrl.toString(), {
          headers: {
            'authorization': authHeader || '',
          },
        });

        if (!clozeResponse.ok) {
          const errorData = await clozeResponse.json();
          // 如果挖词填空数据不足，返回空数组（按需求4：数据不足时跳过）
          return NextResponse.json({
            questions: [],
            total: 0,
            remainingWords: 0,
            mode: 'cloze',
            skipReason: 'insufficient_data',
          });
        }

        const clozeData = await clozeResponse.json();

        return NextResponse.json({
          questions: clozeData.questions || [],
          total: clozeData.total || 0,
          mode: 'cloze',
        });
      } catch (error) {
        console.error('Error calling cloze API:', error);
        // 挖词填空出错时，返回空数组
        return NextResponse.json({
          questions: [],
          total: 0,
          remainingWords: 0,
          mode: 'cloze',
          skipReason: 'error',
        });
      }
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

    // 先获取用户主动收录的 word_id（用于后续扩展查询范围）
    const { data: userCollectedWordIds, error: userCollectedError } = await client
      .from('user_word_contexts')
      .select('word_id')
      .eq('user_id', userId);

    if (userCollectedError) {
      return NextResponse.json({ error: userCollectedError.message }, { status: 500 });
    }

    const collectedWordIdSet = new Set(userCollectedWordIds?.map(c => c.word_id) || []);

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

    // 如果用户有主动收录的单词，且这些单词不在当前词库中，需要额外查询
    let allWords = data || [];
    if (collectedWordIdSet.size > 0) {
      const currentWordIdSet = new Set(allWords.map(w => w.id));
      const missingWordIds = Array.from(collectedWordIdSet).filter(id => !currentWordIdSet.has(id));

      if (missingWordIds.length > 0) {
        const { data: extraWords } = await client
          .from('words')
          .select('*')
          .in('id', missingWordIds);
        if (extraWords) {
          allWords = [...allWords, ...extraWords];
        }
      }
    }

    // 立即洗牌，避免数据库默认排序（通常按 id/字母顺序）导致集中
    allWords = shuffleArray(allWords);

    // 获取用户掌握状态 - 增加 last_correct_date 字段
    const { data: userStatusData, error: userStatusError } = await client
      .from('user_word_status')
      .select('word_id, is_mastered, last_wrong_at, last_correct_date, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (userStatusError) {
      return NextResponse.json({ error: userStatusError.message }, { status: 500 });
    }

    const statusMap = new Map<number, any>();
    (userStatusData || []).forEach((s: any) => {
      if (!statusMap.has(s.word_id)) {
        statusMap.set(s.word_id, s);
      }
    });

    const today = getTodayShanghaiDateString();

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

    const isWordCollected = (word: string): boolean => {
      const ids = wordToIds.get(word) || [];
      return ids.some(id => collectedWordIdSet.has(id));
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
    const uniqueWordRows = Array.from(uniqueWords.values());
    const wordLowerToRow = new Map<string, typeof allWords[0]>();
    uniqueWordRows.forEach((w) => wordLowerToRow.set(w.word.toLowerCase(), w));
    const nearIndex = buildNearFormIndex(uniqueWordRows);

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
    } else if (filter === 'collected') {
      uniqueWords.forEach((w, word) => {
        // 只选择用户收录的、未掌握且今天未答对的单词
        if (isWordCollected(word) && !isWordMastered(word) && !isWordCorrectToday(word)) {
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
      let message = '恭喜！你已经掌握了所有单词！';
      if (filter === 'wrong_words') {
        message = '恭喜！错题集已清空！';
      } else if (filter === 'collected') {
        message = '恭喜！主动收录的单词已全部掌握！';
      }
      return NextResponse.json({ 
        questions: [], 
        total: 0,
        remainingWords: 0,
        message,
      });
    }

    // ========== 复习词逻辑（已掌握的主动收录词低频率复习）==========
    const reviewWords: (typeof allWords[0] & { is_review: boolean })[] = [];
    
    // 只在普通模式下加入复习词
    if (filter !== 'wrong_words' && filter !== 'collected') {
      if (collectedWordIdSet.size > 0) {
        const fourDaysAgoDate = getShanghaiDateWithOffset(-4);
        
        uniqueWords.forEach((w, word) => {
          if (!isWordCollected(word)) return;
          if (!isWordMastered(word)) return;
          if (isWordCorrectToday(word)) return;
          
          // 检查掌握时间是否超过4天
          const ids = wordToIds.get(word) || [];
          const lastCorrectDate = ids
            .map(id => statusMap.get(id)?.last_correct_date)
            .filter(Boolean)
            .sort()
            .pop();
          
          if (lastCorrectDate && lastCorrectDate < fourDaysAgoDate) {
            reviewWords.push({ ...w, is_review: true });
          }
        });
      }
    }

    // 查询用户主动收录的单词（有上下文记录的，且未掌握且今天未答对）
    const { data: userCollectedData } = await client
      .from('user_word_contexts')
      .select(`
        word_id,
        words!inner(id, word, phonetic, meaning, example_sentence, example_sentence_cn, category_id)
      `)
      .eq('user_id', userId);

    // 构建用户收录词的映射（word -> word数据）
    const userCollectedMap = new Map<string, typeof allWords[0]>();
    userCollectedData?.forEach((item: any) => {
      if (item.words) {
        const wordData = item.words;

        // 检查是否已掌握或今天已答对
        const isMastered = isWordMastered(wordData.word);
        const isCorrectToday = isWordCorrectToday(wordData.word);

        if (isMastered || isCorrectToday) {
          return; // 跳过已掌握或今天已答对的词
        }
        userCollectedMap.set(wordData.word, wordData);
      }
    });

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
      // 将用户主动收录的词放在前面（形近词模式下不优先）
      const userCollectedAvailable = Array.from(userCollectedMap.values());
      const otherAvailable = availableWords.filter(w => !userCollectedMap.has(w.word));

      // 洗牌
      const shuffledCollected = shuffleArray(userCollectedAvailable);
      const shuffledOther = shuffleArray(otherAvailable);

      // 前5题为用户主动收录的词（如果有的话），其余随机（形近词模式下不启用此逻辑）
      let collectedWords: typeof allWords = [];
      let remainingWords: typeof allWords = [];

      if (distractorMode === 'near_form') {
        // 形近词模式：所有词随机，不优先主动收录词
        collectedWords = [];
        remainingWords = shuffleArray([...shuffledCollected, ...shuffledOther]).slice(0, limit);
      } else {
        // 普通模式：前5题为用户主动收录的词（如果有的话），其余随机
        const collectedCount = Math.min(5, shuffledCollected.length);
        collectedWords = shuffledCollected.slice(0, collectedCount);
        remainingWords = shuffledOther.slice(0, limit - collectedCount);
      }

      selectedWords = [...collectedWords, ...remainingWords];
    }

    // ========== 插入复习词（分散在整个题目中）==========
    if (reviewWords.length > 0 && selectedWords.length > 0) {
      const shuffledReview = shuffleArray(reviewWords);
      // 最多5个复习词，不超过总题数的5%
      const maxReviewCount = Math.min(5, shuffledReview.length, Math.ceil(selectedWords.length * 0.05));
      const reviewToInsert = shuffledReview.slice(0, maxReviewCount);
      
      // 计算插入间隔：总题数 / (复习词数 + 1)，确保分散
      if (reviewToInsert.length > 0) {
        // 先截断原列表，预留空间给复习词，保持总题数 = limit
        const reservedSpace = reviewToInsert.length;
        const baseWords = selectedWords.slice(0, limit - reservedSpace);
        const interval = Math.floor(baseWords.length / (reviewToInsert.length + 1));
        const newSelectedWords = [...baseWords];
        
        reviewToInsert.forEach((reviewWord, index) => {
          // 从第 interval 题开始插入，避免集中在开头
          const insertPos = Math.min(interval * (index + 1), newSelectedWords.length);
          newSelectedWords.splice(insertPos, 0, reviewWord as any);
        });
        
        selectedWords = newSelectedWords;
      }
    }

    // 获取选中单词的用户上下文例句
    const selectedWordIds = selectedWords.map(w => w.id);
    const { data: userContexts } = await client
      .from('user_word_contexts')
      .select('word_id, context_text, surface_form, is_primary')
      .eq('user_id', userId)
      .in('word_id', selectedWordIds);

    // 构建 word_id -> 上下文例句的映射
    const contextMap = new Map<number, { context: string; surface: string }>();
    userContexts?.forEach(ctx => {
      if (!contextMap.has(ctx.word_id) || ctx.is_primary) {
        contextMap.set(ctx.word_id, { context: ctx.context_text, surface: ctx.surface_form });
      }
    });

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
      
      // 随机选择模式：en-to-zh 或 zh-to-en（形近词模式固定为 zh-to-en）
      const mode = distractorMode === 'near_form' ? 'zh-to-en' : (Math.random() > 0.5 ? 'en-to-zh' : 'zh-to-en');
      
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
        
        // 获取正确答案的首字母（小写）
        const firstLetter = correctAnswer.charAt(0).toLowerCase();
        
        if (distractorMode === 'near_form') {
          const excludeIds = new Set<number>([word.id]);
          const excludeWordsLower = new Set<string>([word.word.toLowerCase()]);
          
          // 形近词模式：强制只查询相同首字母的单词
          const nearCandidates = queryNearFormIndex(correctAnswer, nearIndex, {
            topK: 120,
            minScore: 0.60,
            maxLenDiff: 2,
            expandIfLessThan: 0, // 关键：不扩展到不同首字母，确保4个选项都是相同首字母
            excludeIds,
            excludeWordsLower,
          });
          
          const distractorRows: typeof uniqueWordRows = [];
          const usedNorms = new Set<string>([normalizeSpelling(correctAnswer)]);
          
          // 只选择相同首字母的形近词
          for (const e of nearCandidates) {
            if (distractorRows.length >= 3) break;
            const row = wordLowerToRow.get(e.word.toLowerCase());
            if (!row) continue;
            
            // 强制检查首字母是否相同
            if (row.word.charAt(0).toLowerCase() !== firstLetter) continue;
            
            const n = normalizeSpelling(row.word);
            if (!n || usedNorms.has(n)) continue;
            usedNorms.add(n);
            distractorRows.push(row);
          }
          
          // 如果形近词不足3个，从 otherWords 中补充，但必须是相同首字母
          if (distractorRows.length < 3) {
            const usedWords = new Set<string>([
              ...excludeWordsLower,
              ...distractorRows.map((w) => w.word.toLowerCase()),
            ]);
            for (const w of otherWords) {
              if (distractorRows.length >= 3) break;
              const lw = w.word.toLowerCase();
              if (usedWords.has(lw)) continue;
              
              // 只补充相同首字母的单词
              if (lw.charAt(0) !== firstLetter) continue;
              
              usedWords.add(lw);
              distractorRows.push(w);
            }
          }
          
          // 如果仍然不足3个，回退到普通模式（不使用形近词）
          if (distractorRows.length < 3) {
            options = [
              word.word,
              ...shuffledOptions.map((w) => w.word),
            ];
          } else {
            options = [word.word, ...distractorRows.map((w) => w.word)];
          }
        } else {
          options = [
            word.word,
            ...shuffledOptions.map((w) => w.word),
          ];
        }
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

      // 获取用户上下文例句（如果有）
      const userContext = contextMap.get(word.id);

      return {
        id: word.id,
        word: word.word,
        phonetic: word.phonetic,
        meaning: word.meaning,
        example_sentence: userContext?.context || word.example_sentence,
        example_sentence_cn: word.example_sentence_cn,
        has_user_context: !!userContext,
        question,
        options: shuffledFinal,
        correctAnswer,
        mode,
        is_review: !!(word as any).is_review, // 标记是否为复习词
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
