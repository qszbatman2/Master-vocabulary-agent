import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getShanghaiDateFromTimestamp, getShanghaiDaySpan } from '@/lib/shanghai-date';

const ADMIN_TOKEN = process.env.ADMIN_KEY || 'vocabulary-admin-2024';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token !== ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = getSupabaseClient();
    const email = request.nextUrl.searchParams.get('email') || 'qszbatman2@gmail.com';
    const word = request.nextUrl.searchParams.get('word') || 'censor';

    // 查找用户
    const { data: user } = await client
      .from('users')
      .select('id, email, nickname')
      .eq('email', email)
      .single();

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 查找单词
    const { data: words } = await client
      .from('words')
      .select('id, word, meaning, category_id')
      .eq('word', word);

    if (!words || words.length === 0) {
      return NextResponse.json({ error: '单词不存在' }, { status: 404 });
    }

    const wordId = words[0].id;

    // 查询状态 - 返回所有字段
    const { data: status, error } = await client
      .from('user_word_status')
      .select('*')
      .eq('user_id', user.id)
      .eq('word_id', wordId)
      .single();

    if (error) {
      return NextResponse.json({ error: '查询失败', details: error.message }, { status: 500 });
    }

    if (!status) {
      return NextResponse.json({ error: '无学习记录' }, { status: 404 });
    }

    // 分析数据
    // 计算上海自然日跨度
    const daysSpan = getShanghaiDaySpan(status.created_at, status.last_practiced_at);

    // 推断问题
    const problems: string[] = [];
    
    if (status.correct_count > 0 && status.daily_correct_count === 0) {
      problems.push(`答对 ${status.correct_count} 次但 daily_correct_count = 0，数据异常`);
    }
    
    if (daysSpan >= 1 && status.daily_correct_count === 1 && status.correct_count >= 2) {
      problems.push(`跨 ${daysSpan} 天学习，答对 ${status.correct_count} 次，但只有 1 天有效答对记录`);
    }
    
    if (status.wrong_count === 0 && status.correct_count >= 5 && status.daily_correct_count === 1) {
      problems.push(`全部答对 ${status.correct_count} 次但只记录了 1 天有效答对，可能存在BUG`);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
      word: {
        id: wordId,
        word: words[0].word,
        meaning: words[0].meaning,
      },
      
      // 完整的状态数据
      status: {
        id: status.id,
        is_mastered: status.is_mastered,
        total_practice_count: status.total_practice_count,
        correct_count: status.correct_count,
        wrong_count: status.wrong_count,
        consecutive_correct: status.consecutive_correct,
        daily_correct_count: status.daily_correct_count,
        last_correct_date: status.last_correct_date,
        round_consecutive_correct: status.round_consecutive_correct,
        created_at: status.created_at,
        updated_at: status.updated_at,
        last_practiced_at: status.last_practiced_at,
        last_wrong_at: status.last_wrong_at,
      },
      
      // 时间分析
      time_analysis: {
        created_at_local: status.created_at,
        updated_at_local: status.updated_at,
        last_practiced_at_local: status.last_practiced_at,
        last_correct_date: status.last_correct_date,
        days_between_first_and_last: daysSpan,
      },
      
      // 问题诊断
      diagnosis: {
        has_problem: problems.length > 0,
        problems: problems,
        expected_daily_correct_count: Math.min(daysSpan + 1, status.correct_count),
        actual_daily_correct_count: status.daily_correct_count,
        should_be_mastered: Math.min(daysSpan + 1, status.correct_count) >= 4,
        is_mastered: status.is_mastered,
      },
      
      // 推断的答题历史（基于现有数据）
      inferred_history: {
        first_practice_date: getShanghaiDateFromTimestamp(status.created_at),
        last_practice_date: getShanghaiDateFromTimestamp(status.last_practiced_at),
        first_practice_result: status.wrong_count === 0 ? '可能答对' : '可能答错',
        note: '数据库没有答题日志表，无法获取详细答题历史',
      },
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
