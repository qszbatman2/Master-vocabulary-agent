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
    const filter = searchParams.get('filter'); // 'wrong_words' - 错题集
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const userId = token ? getUserIdFromToken(token) : null;

    // 获取词库分类
    const { data: categories, error: categoriesError } = await client
      .from('vocabulary_categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (categoriesError) {
      return NextResponse.json({ error: categoriesError.message }, { status: 500 });
    }

    // 如果是错题集或掌握状态筛选，需要特殊处理
    let words: any[] = [];
    let totalCount = 0;

    if (userId && (filter === 'wrong_words' || (masteredStatus && masteredStatus !== 'all'))) {
      // 错题集或掌握状态筛选 - 先获取符合条件的单词ID
      let statusQuery = client
        .from('user_word_status')
        .select('word_id, is_mastered, consecutive_correct, total_practice_count, correct_count, wrong_count, last_wrong_at')
        .eq('user_id', userId);

      if (filter === 'wrong_words') {
        // 错题集：最近7天有错误记录
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        statusQuery = statusQuery.not('last_wrong_at', 'is', null).gte('last_wrong_at', sevenDaysAgo.toISOString());
      }
      
      // 掌握状态筛选（可与错题集组合）
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
        // 没有符合条件的单词
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
        const wordIds = wordDataList.map(w => w.wordId);
        const { data: searchWords } = await client
          .from('words')
          .select('id')
          .in('id', wordIds)
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
        };
      });

      // 去重：同一个单词可能存在于多个分类中
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
    } else {
      // 普通查询
      let query = client
        .from('words')
        .select('*', { count: 'exact' });

      if (categoryId && categoryId !== 'all') {
        query = query.eq('category_id', parseInt(categoryId));
      }

      if (search) {
        query = query.or(`word.ilike.%${search}%,meaning.ilike.%${search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data: wordsData, error: wordsError, count } = await query
        .range(from, to)
        .order('created_at', { ascending: true });

      if (wordsError) {
        return NextResponse.json({ error: wordsError.message }, { status: 500 });
      }

      words = wordsData || [];
      totalCount = count || 0;

      // 去重：同一个单词可能存在于多个分类中，搜索时只保留一个
      if (!categoryId || categoryId === 'all') {
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

      // 获取用户掌握状态
      if (userId && words.length > 0) {
        const wordIds = words.map(w => w.id);
        const { data: statusData } = await client
          .from('user_word_status')
          .select('word_id, is_mastered, consecutive_correct, total_practice_count, correct_count, wrong_count, last_wrong_at')
          .eq('user_id', userId)
          .in('word_id', wordIds);

        const statusMap = new Map(statusData?.map(s => [s.word_id, s]) || []);

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
            } : null,
          };
        });
      } else {
        words = words.map((word) => {
          const category = categories?.find((c) => c.id === word.category_id);
          return {
            ...word,
            vocabulary_categories: { name: category?.name || '' },
            userStatus: null,
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
