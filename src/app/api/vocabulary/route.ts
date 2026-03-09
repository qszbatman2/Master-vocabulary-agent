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

    // 构建单词查询
    let query = client
      .from('words')
      .select('*', { count: 'exact' });

    if (categoryId && categoryId !== 'all') {
      query = query.eq('category_id', parseInt(categoryId));
    }

    if (search) {
      query = query.or(`word.ilike.%${search}%,meaning.ilike.%${search}%`);
    }

    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to).order('created_at', { ascending: true });

    const { data: words, error: wordsError, count } = await query;

    if (wordsError) {
      return NextResponse.json({ error: wordsError.message }, { status: 500 });
    }

    // 获取用户掌握状态
    let userStatus: Record<number, { isMastered: boolean; consecutiveCorrect: number; totalPracticeCount: number }> = {};
    if (userId && words && words.length > 0) {
      const wordIds = words.map(w => w.id);
      const { data: statusData } = await client
        .from('user_word_status')
        .select('word_id, is_mastered, consecutive_correct, total_practice_count')
        .eq('user_id', userId)
        .in('word_id', wordIds);

      statusData?.forEach(s => {
        userStatus[s.word_id] = {
          isMastered: s.is_mastered,
          consecutiveCorrect: s.consecutive_correct,
          totalPracticeCount: s.total_practice_count,
        };
      });
    }

    // 关联分类名称和用户状态
    let wordsWithStatus = words?.map((word) => {
      const category = categories?.find((c) => c.id === word.category_id);
      const status = userStatus[word.id];
      return {
        ...word,
        vocabulary_categories: { name: category?.name || '' },
        userStatus: status ? {
          isMastered: status.isMastered,
          consecutiveCorrect: status.consecutiveCorrect,
          totalPracticeCount: status.totalPracticeCount,
        } : null,
      };
    }) || [];

    // 按掌握状态筛选
    if (userId && masteredStatus && masteredStatus !== 'all') {
      if (masteredStatus === 'mastered') {
        wordsWithStatus = wordsWithStatus.filter(w => w.userStatus?.isMastered);
      } else if (masteredStatus === 'unmastered') {
        wordsWithStatus = wordsWithStatus.filter(w => !w.userStatus?.isMastered);
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
      words: wordsWithStatus,
      total: count || 0,
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
