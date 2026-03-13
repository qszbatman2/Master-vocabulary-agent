import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const ADMIN_TOKEN = 'vocabulary-admin-2024';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token !== ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, word, wordId: bodyWordId, fix = false } = body;

    if (!email || (!word && !bodyWordId)) {
      return NextResponse.json({ error: '缺少email或word/wordId参数' }, { status: 400 });
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

    // 查找单词 - 支持通过 wordId 或 word 文本查找
    let wordId = bodyWordId;
    let wordText = word;
    
    if (wordId) {
      const { data: wordData } = await client
        .from('words')
        .select('id, word, meaning')
        .eq('id', wordId)
        .single();
      if (wordData) {
        wordText = wordData.word;
      }
    } else if (word) {
      const { data: words } = await client
        .from('words')
        .select('id, word, meaning')
        .eq('word', word);
      if (words && words.length > 0) {
        wordId = words[0].id;
      }
    }

    if (!wordId) {
      return NextResponse.json({ error: '单词不存在' }, { status: 404 });
    }

    // 查询当前状态
    const { data: status, error: statusError } = await client
      .from('user_word_status')
      .select('*')
      .eq('user_id', user.id)
      .eq('word_id', wordId)
      .single();

    if (statusError || !status) {
      return NextResponse.json({ error: '无学习记录', details: statusError?.message }, { status: 404 });
    }

    // 分析数据
    const createdAt = new Date(status.created_at);
    const lastPracticedAt = new Date(status.last_practiced_at);
    const daysSpan = Math.floor((lastPracticedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    // 计算应该的有效答对天数
    // 逻辑：如果全部答对且跨越多天，应该有 min(daysSpan + 1, correct_count) 天有效答对
    const expectedDailyCorrect = Math.min(daysSpan + 1, status.correct_count);
    const actualDailyCorrect = status.daily_correct_count || 0;
    
    const analysis = {
      word: word,
      current_data: {
        total_practice_count: status.total_practice_count,
        correct_count: status.correct_count,
        wrong_count: status.wrong_count,
        daily_correct_count: actualDailyCorrect,
        last_correct_date: status.last_correct_date,
        is_mastered: status.is_mastered,
        created_at: status.created_at,
        last_practiced_at: status.last_practiced_at,
      },
      analysis: {
        days_span: daysSpan,
        expected_daily_correct_count: expectedDailyCorrect,
        actual_daily_correct_count: actualDailyCorrect,
        has_issue: expectedDailyCorrect > actualDailyCorrect,
        should_be_mastered: expectedDailyCorrect >= 4,
      },
    };

    // 如果需要修复
    if (fix && expectedDailyCorrect > actualDailyCorrect) {
      const newDailyCorrectCount = Math.min(expectedDailyCorrect, 4);
      const newIsMastered = newDailyCorrectCount >= 4;
      
      // 获取今天的日期作为新的 last_correct_date
      const now = new Date();
      const shanghaiTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      const today = shanghaiTime.toISOString().split('T')[0];

      const { error: updateError } = await client
        .from('user_word_status')
        .update({
          daily_correct_count: newDailyCorrectCount,
          is_mastered: newIsMastered,
          last_correct_date: today,
          updated_at: now.toISOString(),
        })
        .eq('id', status.id);

      if (updateError) {
        return NextResponse.json({
          ...analysis,
          fix_result: { success: false, error: updateError.message }
        }, { status: 500 });
      }

      return NextResponse.json({
        ...analysis,
        fix_result: {
          success: true,
          old_daily_correct_count: actualDailyCorrect,
          new_daily_correct_count: newDailyCorrectCount,
          old_is_mastered: status.is_mastered,
          new_is_mastered: newIsMastered,
        }
      });
    }

    return NextResponse.json(analysis);

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// GET 方法用于查询（不修复）
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

    const { data: user } = await client
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const { data: words } = await client
      .from('words')
      .select('id, word, meaning')
      .eq('word', word);

    if (!words || words.length === 0) {
      return NextResponse.json({ error: '单词不存在' }, { status: 404 });
    }

    const { data: status } = await client
      .from('user_word_status')
      .select('*')
      .eq('user_id', user.id)
      .eq('word_id', words[0].id)
      .single();

    if (!status) {
      return NextResponse.json({ error: '无学习记录' }, { status: 404 });
    }

    // 计算预期值
    const createdAt = new Date(status.created_at);
    const lastPracticedAt = new Date(status.last_practiced_at);
    const daysSpan = Math.floor((lastPracticedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const expectedDailyCorrect = Math.min(daysSpan + 1, status.correct_count);

    return NextResponse.json({
      word: word,
      status: {
        total_practice_count: status.total_practice_count,
        correct_count: status.correct_count,
        wrong_count: status.wrong_count,
        daily_correct_count: status.daily_correct_count,
        last_correct_date: status.last_correct_date,
        is_mastered: status.is_mastered,
        created_at: status.created_at,
        last_practiced_at: status.last_practiced_at,
      },
      diagnosis: {
        days_span: daysSpan,
        expected_daily_correct: expectedDailyCorrect,
        actual_daily_correct: status.daily_correct_count || 0,
        has_issue: expectedDailyCorrect > (status.daily_correct_count || 0),
        should_be_mastered: expectedDailyCorrect >= 4,
      }
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
