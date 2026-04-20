import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getShanghaiDaySpan, getTodayShanghaiDateString } from '@/lib/shanghai-date';

const ADMIN_TOKEN = process.env.ADMIN_KEY || 'vocabulary-admin-2024';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token !== ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = request.nextUrl.searchParams.get('email');
    const fix = request.nextUrl.searchParams.get('fix') === 'true';

    if (!email) {
      return NextResponse.json({ error: '缺少email参数' }, { status: 400 });
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

    // 查询所有学习记录
    const { data: statuses, error } = await client
      .from('user_word_status')
      .select(`
        id,
        word_id,
        is_mastered,
        total_practice_count,
        correct_count,
        wrong_count,
        daily_correct_count,
        last_correct_date,
        created_at,
        last_practiced_at
      `)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 获取所有单词信息
    const wordIds = statuses?.map(s => s.word_id) || [];
    const { data: words } = await client
      .from('words')
      .select('id, word')
      .in('id', wordIds);

    const wordMap = new Map(words?.map(w => [w.id, w.word]) || []);

    // 分析每条记录
    const issues: any[] = [];
    const fixed: any[] = [];
    const now = new Date();
    const today = getTodayShanghaiDateString();

    for (const status of statuses || []) {
      // 只分析未掌握且全对或大部分对的记录
      if (status.is_mastered) continue;
      if (status.correct_count < 2) continue;
      
      const daysSpan = getShanghaiDaySpan(status.created_at, status.last_practiced_at);
      
      // 计算预期的有效答对天数
      // 如果全对或大部分对，且跨越多天，应该有 min(跨越天数+1, 答对次数) 天有效答对
      const expectedDailyCorrect = Math.min(daysSpan + 1, status.correct_count);
      const actualDailyCorrect = status.daily_correct_count || 0;
      
      // 如果预期值大于实际值，说明有问题
      if (expectedDailyCorrect > actualDailyCorrect) {
        const wordText = wordMap.get(status.word_id) || `word_id:${status.word_id}`;
        const issue = {
          word: wordText,
          word_id: status.word_id,
          status_id: status.id,
          analysis: {
            days_span: daysSpan,
            correct_count: status.correct_count,
            wrong_count: status.wrong_count,
            expected_daily_correct: expectedDailyCorrect,
            actual_daily_correct: actualDailyCorrect,
            gap: expectedDailyCorrect - actualDailyCorrect,
            should_be_mastered: expectedDailyCorrect >= 4,
          }
        };
        
        if (fix) {
          // 修复
          const newDailyCorrectCount = Math.min(expectedDailyCorrect, 4);
          const newIsMastered = newDailyCorrectCount >= 4;
          
          const { error: updateError } = await client
            .from('user_word_status')
            .update({
              daily_correct_count: newDailyCorrectCount,
              is_mastered: newIsMastered,
              last_correct_date: today,
              updated_at: now.toISOString(),
            })
            .eq('id', status.id);

          if (!updateError) {
            fixed.push({
              ...issue,
              fix_result: {
                old_daily_correct_count: actualDailyCorrect,
                new_daily_correct_count: newDailyCorrectCount,
                new_is_mastered: newIsMastered,
              }
            });
          }
        } else {
          issues.push(issue);
        }
      }
    }

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      total_records: statuses?.length || 0,
      issues_found: issues.length,
      issues: issues.sort((a, b) => b.analysis.gap - a.analysis.gap),
      ...(fix ? { fixed_count: fixed.length, fixed } : {}),
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
