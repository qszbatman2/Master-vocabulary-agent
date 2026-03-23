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
    const search = searchParams.get('search');
    const masteredStatus = searchParams.get('mastered'); // 'all', 'mastered', 'unmastered'
    const filter = searchParams.get('filter'); // 'wrong_words' - 错题集, 'collected' - 主动收录
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const userId = token ? getUserIdFromToken(token) : null;

    // 获取词库分类
    const { data: allCategories, error: categoriesError } = await client
      .from('vocabulary_categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (categoriesError) {
      return NextResponse.json({ error: categoriesError.message }, { status: 500 });
    }

    // 过滤掉没有词汇的分类
    const categories: typeof allCategories = [];
    for (const category of allCategories || []) {
      const { count } = await client
        .from('words')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id);
      if (count && count > 0) {
        categories.push(category);
      }
    }

    let words: any[] = [];
    let totalCount = 0;

    // 主动收录筛选
    if (userId && filter === 'collected') {
      const { data: collectedData, error: collectedError } = await client
        .from('user_word_contexts')
        .select('word_id, context_text, surface_form')
        .eq('user_id', userId);
      
      if (collectedError) {
        console.error('Collected query error:', collectedError);
        return NextResponse.json({ error: collectedError.message }, { status: 500 });
      }

      if (!collectedData || collectedData.length === 0) {
        return NextResponse.json({
          categories,
          words: [],
          total: 0,
          page,
          pageSize,
          stats: null,
        });
      }

      // 获取单词信息
      const wordIds = [...new Set(collectedData.map(c => c.word_id))];
      
      // 搜索过滤
      let filteredWordIds = wordIds;
      if (search) {
        const { data: searchWords } = await client
          .from('words')
          .select('id')
          .in('id', wordIds)
          .or(`word.ilike.%${search}%,meaning.ilike.%${search}%`);
        filteredWordIds = searchWords?.map(w => w.id) || [];
      }

      // 分类过滤
      if (categoryId && categoryId !== 'all') {
        const { data: categoryWords } = await client
          .from('words')
          .select('id')
          .in('id', filteredWordIds)
          .eq('category_id', parseInt(categoryId));
        filteredWordIds = categoryWords?.map(w => w.id) || [];
      }

      if (filteredWordIds.length === 0) {
        return NextResponse.json({
          categories,
          words: [],
          total: 0,
          page,
          pageSize,
          stats: null,
        });
      }

      // 分页
      totalCount = filteredWordIds.length;
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedWordIds = filteredWordIds.slice(from, to);

      // 获取单词详情
      const { data: wordsData, error: wordsError } = await client
        .from('words')
        .select('*')
        .in('id', paginatedWordIds);

      if (wordsError) {
        return NextResponse.json({ error: wordsError.message }, { status: 500 });
      }

      // 构建上下文映射
      const contextMap = new Map<number, { context: string; surface: string }[]>();
      collectedData.forEach(c => {
        if (!contextMap.has(c.word_id)) {
          contextMap.set(c.word_id, []);
        }
        contextMap.get(c.word_id)!.push({
          context: c.context_text,
          surface: c.surface_form,
        });
      });

      // 获取用户状态
      const { data: statusData } = await client
        .from('user_word_status')
        .select('word_id, is_mastered, consecutive_correct, total_practice_count, correct_count, wrong_count, last_wrong_at, daily_correct_count')
        .eq('user_id', userId)
        .in('word_id', paginatedWordIds);
      
      const statusMap = new Map(statusData?.map(s => [s.word_id, s]) || []);

      words = (wordsData || []).map((word) => {
        const category = categories?.find((c) => c.id === word.category_id);
        const status = statusMap.get(word.id);
        return {
          ...word,
          vocabulary_categories: { name: category?.name || '' },
          userStatus: status ? {
            isMastered: status.is_mastered,
            consecutiveCorrect: status.consecutive_correct,
            totalPracticeCount: status.total_practice_count,
            correctCount: status.correct_count,
            wrongCount: status.wrong_count,
            lastWrongAt: status.last_wrong_at,
            dailyCorrectCount: status.daily_correct_count,
          } : null,
          userContexts: contextMap.get(word.id) || [],
        };
      });
    }
    // 错题集或掌握状态筛选
    else if (userId && (filter === 'wrong_words' || (masteredStatus && masteredStatus !== 'all'))) {
      let statusQuery = client
        .from('user_word_status')
        .select('word_id, is_mastered, consecutive_correct, total_practice_count, correct_count, wrong_count, last_wrong_at')
        .eq('user_id', userId);

      if (filter === 'wrong_words') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        statusQuery = statusQuery.not('last_wrong_at', 'is', null).gte('last_wrong_at', sevenDaysAgo.toISOString());
      }
      
      if (masteredStatus === 'mastered') {
        statusQuery = statusQuery.eq('is_mastered', true);
      } else if (masteredStatus === 'unmastered') {
        statusQuery = statusQuery.eq('is_mastered', false);
      }

      const { data: statusData, error: statusError } = await statusQuery;
      
      if (statusError) {
        console.error('Status query error:', statusError);
        return NextResponse.json({ error: statusError.message }, { status: 500 });
      }

      if (!statusData || statusData.length === 0) {
        return NextResponse.json({
          categories,
          words: [],
          total: 0,
          page,
          pageSize,
          stats: null,
        });
      }

      // 获取单词信息并按分类筛选
      const wordIds = statusData.map(s => s.word_id);
      let wordsQuery = client
        .from('words')
        .select('id, category_id')
        .in('id', wordIds);

      if (categoryId && categoryId !== 'all') {
        wordsQuery = wordsQuery.eq('category_id', parseInt(categoryId));
      }

      const { data: wordsCategoryData } = await wordsQuery;

      if (!wordsCategoryData || wordsCategoryData.length === 0) {
        return NextResponse.json({
          categories,
          words: [],
          total: 0,
          page,
          pageSize,
          stats: null,
        });
      }

      // 创建状态映射
      const statusMap = new Map(statusData.map(s => [s.word_id, s]));
      const filteredWordIds = new Set(wordsCategoryData.map(w => w.id));

      // 提取单词信息
      const wordDataList = statusData
        .filter(s => filteredWordIds.has(s.word_id))
        .map(s => ({
          wordId: s.word_id,
          status: s
        }));

      // 搜索过滤
      let filteredWordData = wordDataList;
      if (search) {
        const wordIdsToSearch = wordDataList.map(w => w.wordId);
        const { data: searchWords } = await client
          .from('words')
          .select('id')
          .in('id', wordIdsToSearch)
          .or(`word.ilike.%${search}%,meaning.ilike.%${search}%`);
        
        const searchWordIds = new Set(searchWords?.map(w => w.id) || []);
        filteredWordData = wordDataList.filter(w => searchWordIds.has(w.wordId));
      }

      if (filteredWordData.length === 0) {
        return NextResponse.json({
          categories,
          words: [],
          total: 0,
          page,
          pageSize,
          stats: null,
        });
      }

      // 分页
      totalCount = filteredWordData.length;
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedWordData = filteredWordData.slice(from, to);
      const paginatedWordIds = paginatedWordData.map(w => w.wordId);

      // 获取单词详情
      const { data: wordsData, error: wordsError } = await client
        .from('words')
        .select('*')
        .in('id', paginatedWordIds);

      if (wordsError) {
        return NextResponse.json({ error: wordsError.message }, { status: 500 });
      }

      // 获取用户收录的例句
      const { data: contextsData } = await client
        .from('user_word_contexts')
        .select('word_id, context_text, surface_form')
        .eq('user_id', userId)
        .in('word_id', paginatedWordIds);

      const contextMap = new Map<number, { context: string; surface: string }[]>();
      contextsData?.forEach(c => {
        if (!contextMap.has(c.word_id)) {
          contextMap.set(c.word_id, []);
        }
        contextMap.get(c.word_id)!.push({
          context: c.context_text,
          surface: c.surface_form,
        });
      });

      words = (wordsData || []).map((word) => {
        const category = categories?.find((c) => c.id === word.category_id);
        const status = statusMap.get(word.id);
        return {
          ...word,
          vocabulary_categories: { name: category?.name || '' },
          userStatus: status ? {
            isMastered: status.is_mastered,
            consecutiveCorrect: status.consecutive_correct,
            totalPracticeCount: status.total_practice_count,
            correctCount: status.correct_count,
            wrongCount: status.wrong_count,
            lastWrongAt: status.last_wrong_at,
          } : null,
          userContexts: contextMap.get(word.id) || [],
        };
      });

      // 去重
      const seenWords = new Set<string>();
      const uniqueWords: any[] = [];
      for (const word of words) {
        if (!seenWords.has(word.word)) {
          seenWords.add(word.word);
          uniqueWords.push(word);
        }
      }
      words = uniqueWords;
      totalCount = words.length;
    }
    // 普通查询
    else {
      if (!categoryId || categoryId === 'all') {
        // 获取所有单词（分页获取）
        let allWordsData: any[] = [];
        let hasMore = true;
        let offset = 0;
        const batchSize = 1000;
        
        while (hasMore) {
          let query = client
            .from('words')
            .select('id, word, phonetic, meaning, example_sentence, example_sentence_cn, category_id, created_at')
            .range(offset, offset + batchSize - 1);

          if (search) {
            query = query.or(`word.ilike.%${search}%,meaning.ilike.%${search}%`);
          }

          const { data: batchData, error: wordsError } = await query.order('word', { ascending: true });

          if (wordsError) {
            return NextResponse.json({ error: wordsError.message }, { status: 500 });
          }

          if (batchData && batchData.length > 0) {
            allWordsData = allWordsData.concat(batchData);
            offset += batchSize;
            hasMore = batchData.length === batchSize;
          } else {
            hasMore = false;
          }
        }

        // 去重
        const seenWords = new Set<string>();
        const uniqueWords: any[] = [];
        for (const word of allWordsData) {
          if (!seenWords.has(word.word)) {
            seenWords.add(word.word);
            uniqueWords.push(word);
          }
        }

        uniqueWords.sort((a, b) => a.word.toLowerCase().localeCompare(b.word.toLowerCase()));

        totalCount = uniqueWords.length;
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        words = uniqueWords.slice(from, to);
      } else {
        // 指定了分类，直接分页查询
        let query = client
          .from('words')
          .select('*', { count: 'exact' });

        query = query.eq('category_id', parseInt(categoryId));

        if (search) {
          query = query.or(`word.ilike.%${search}%,meaning.ilike.%${search}%`);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        const { data: wordsData, error: wordsError, count } = await query
          .range(from, to)
          .order('word', { ascending: true });

        if (wordsError) {
          return NextResponse.json({ error: wordsError.message }, { status: 500 });
        }

        words = wordsData || [];
        totalCount = count || 0;
      }

      // 获取用户掌握状态和收录例句
      if (userId && words.length > 0) {
        const wordIds = words.map(w => w.id);
        const { data: statusData } = await client
          .from('user_word_status')
          .select('word_id, is_mastered, consecutive_correct, total_practice_count, correct_count, wrong_count, last_wrong_at, daily_correct_count')
          .eq('user_id', userId)
          .in('word_id', wordIds);

        const statusMap = new Map(statusData?.map(s => [s.word_id, s]) || []);

        // 获取用户收录的例句
        const { data: contextsData } = await client
          .from('user_word_contexts')
          .select('word_id, context_text, surface_form')
          .eq('user_id', userId)
          .in('word_id', wordIds);

        const contextMap = new Map<number, { context: string; surface: string }[]>();
        contextsData?.forEach(c => {
          if (!contextMap.has(c.word_id)) {
            contextMap.set(c.word_id, []);
          }
          contextMap.get(c.word_id)!.push({
            context: c.context_text,
            surface: c.surface_form,
          });
        });

        words = words.map((word) => {
          const category = categories?.find((c) => c.id === word.category_id);
          const status = statusMap.get(word.id);
          return {
            ...word,
            vocabulary_categories: { name: category?.name || '' },
            userStatus: status ? {
              isMastered: status.is_mastered,
              consecutiveCorrect: status.consecutive_correct,
              totalPracticeCount: status.total_practice_count,
              correctCount: status.correct_count,
              wrongCount: status.wrong_count,
              lastWrongAt: status.last_wrong_at,
              dailyCorrectCount: status.daily_correct_count,
            } : null,
            userContexts: contextMap.get(word.id) || [],
          };
        });
      } else {
        words = words.map((word) => {
          const category = categories?.find((c) => c.id === word.category_id);
          return {
            ...word,
            vocabulary_categories: { name: category?.name || '' },
            userStatus: null,
            userContexts: [],
          };
        });
      }
    }

    // 获取统计信息
    let stats = null;
    if (userId) {
      const { count: totalWords } = await client
        .from('words')
        .select('*', { count: 'exact', head: true });

      const { count: masteredWords } = await client
        .from('user_word_status')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_mastered', true);

      stats = {
        totalWords: totalWords || 0,
        masteredWords: masteredWords || 0,
        unmasteredWords: (totalWords || 0) - (masteredWords || 0),
      };
    }

    return NextResponse.json({
      categories,
      words,
      total: totalCount,
      page,
      pageSize,
      stats,
    });
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vocabulary' },
      { status: 500 }
    );
  }
}
