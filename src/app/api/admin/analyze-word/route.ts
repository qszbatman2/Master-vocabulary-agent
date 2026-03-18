import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const ADMIN_TOKEN = process.env.ADMIN_KEY || 'vocabulary-admin-2024';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token !== ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = request.nextUrl.searchParams.get('email');
    const word = request.nextUrl.searchParams.get('word');

    if (!email || !word) {
      return NextResponse.json({ error: '缺少email或word参数' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 查找用户
    const { data: user } = await client
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 查找单词
    const { data: words } = await client
      .from('words')
      .select('id, word, meaning')
      .eq('word', word);

    if (!words || words.length === 0) {
      return NextResponse.json({ error: '单词不存在' }, { status: 404 });
    }

    const wordId = words[0].id;

    // 查询状态
    const { data: status } = await client
      .from('user_word_status')
      .select('*')
      .eq('user_id', user.id)
      .eq('word_id', wordId)
      .single();

    if (!status) {
      return NextResponse.json({ error: '无学习记录' }, { status: 404 });
    }

    // 详细分析
    const analysis = {
      word: word,
      user: email,
      
      // 原始数据
      raw_data: {
        total_practice_count: status.total_practice_count,
        correct_count: status.correct_count,
        wrong_count: status.wrong_count,
        daily_correct_count: status.daily_correct_count,
        last_correct_date: status.last_correct_date,
        consecutive_correct: status.consecutive_correct,
        created_at: status.created_at,
        updated_at: status.updated_at,
        last_practiced_at: status.last_practiced_at,
      },
      
      // 时间分析
      time_analysis: {
        first_practice: status.created_at,
        last_practice: status.last_practiced_at,
        first_practice_date: status.created_at?.split('T')[0],
        last_practice_date: status.last_practiced_at?.split('T')[0],
        days_span: Math.floor(
          (new Date(status.last_practiced_at).getTime() - new Date(status.created_at).getTime()) 
          / (1000 * 60 * 60 * 24)
        ),
      },
      
      // 问题分析
      problem_analysis: null as any,
      
      // 推断的可能答题日期
      estimated_practice_days: [] as string[],
    };

    // 问题分析
    const problems: string[] = [];
    const daysSpan = analysis.time_analysis.days_span;
    
    if (status.correct_count >= 5 && status.daily_correct_count === 1) {
      problems.push(`答对 ${status.correct_count} 次但只有 1 天有效答对记录`);
    }
    
    if (daysSpan >= 2 && status.daily_correct_count === 1) {
      problems.push(`跨越 ${daysSpan} 天学习但只有 1 天有效答对`);
    }

    if (status.daily_correct_count >= 4 && !status.is_mastered) {
      problems.push(`有效答对天数 ${status.daily_correct_count} 天但未标记掌握`);
    }

    analysis.problem_analysis = {
      has_problem: problems.length > 0,
      problems: problems,
      conclusion: problems.length > 0 
        ? '数据异常，可能存在BUG' 
        : '数据正常',
    };

    return NextResponse.json(analysis);

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
