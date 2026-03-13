import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 管理员授权码
const ADMIN_TOKEN = 'vocabulary-admin-2024';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token !== ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = request.nextUrl.searchParams.get('email');
    const word = request.nextUrl.searchParams.get('word');

    if (!email) {
      return NextResponse.json({ error: '缺少email参数' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 查找用户
    const { data: user, error: userError } = await client
      .from('users')
      .select('id, email, nickname')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: '用户不存在', details: userError?.message }, { status: 404 });
    }

    // 如果指定了单词，查询单词详情
    let wordInfo = null;
    let wordIds: number[] = [];
    
    if (word) {
      const { data: words } = await client
        .from('words')
        .select('id, word, meaning, phonetic, category_id')
        .eq('word', word);
      
      if (words && words.length > 0) {
        wordInfo = words;
        wordIds = words.map(w => w.id);
      }
    }

    // 查询用户学习记录
    let statusQuery = client
      .from('user_word_status')
      .select(`
        word_id,
        is_mastered,
        total_practice_count,
        correct_count,
        wrong_count,
        consecutive_correct,
        daily_correct_count,
        last_correct_date,
        round_consecutive_correct,
        last_practiced_at,
        last_wrong_at,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id);

    if (wordIds.length > 0) {
      statusQuery = statusQuery.in('word_id', wordIds);
    }

    const { data: statuses, error: statusError } = await statusQuery.order('last_practiced_at', { ascending: false });

    if (statusError) {
      return NextResponse.json({ error: '查询学习记录失败', details: statusError.message }, { status: 500 });
    }

    // 如果指定了单词，返回详细分析
    if (word && wordIds.length > 0) {
      const wordStatuses = statuses || [];
      
      // 获取单词分类名称
      const { data: categories } = await client
        .from('vocabulary_categories')
        .select('id, name');
      
      const categoryMap = new Map(categories?.map(c => [c.id, c.name]) || []);

      const detailedStatus = wordStatuses.map(s => {
        const wordData = wordInfo?.find(w => w.id === s.word_id);
        return {
          ...s,
          word: wordData?.word,
          meaning: wordData?.meaning,
          phonetic: wordData?.phonetic,
          category_id: wordData?.category_id,
          category_name: wordData?.category_id ? categoryMap.get(wordData.category_id) : null,
        };
      });

      // 分析是否应该已掌握
      let masteryAnalysis = null;
      if (detailedStatus.length > 0) {
        const status = detailedStatus[0];
        masteryAnalysis = {
          current_mastered: status.is_mastered,
          daily_correct_count: status.daily_correct_count,
          last_correct_date: status.last_correct_date,
          total_correct: status.correct_count,
          total_wrong: status.wrong_count,
          should_be_mastered: status.daily_correct_count >= 4,
          reason: status.daily_correct_count >= 4 
            ? `已累计 ${status.daily_correct_count} 天有效答对，达到4天标准` 
            : `仅累计 ${status.daily_correct_count} 天有效答对，需要4天`,
          practice_dates: [] as string[], // 可以扩展查询每日记录
        };
      }

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
        },
        word_info: wordInfo,
        learning_records: detailedStatus,
        mastery_analysis: masteryAnalysis,
      });
    }

    // 返回用户概览
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
      word_filter: word,
      total_records: statuses?.length || 0,
      mastered_count: statuses?.filter(s => s.is_mastered)?.length || 0,
      records: statuses?.slice(0, 50), // 最多返回50条
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: '服务器错误', details: String(error) }, { status: 500 });
  }
}
