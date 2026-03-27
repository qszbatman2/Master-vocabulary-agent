import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { addClampedDurationSeconds, MAX_DAILY_SECONDS } from '@/lib/duration';

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

// 获取今天的日期字符串 (YYYY-MM-DD) - 使用上海时区
function getTodayDateString(): string {
  const now = new Date();
  // 使用上海时区 (UTC+8)
  const shanghaiTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return shanghaiTime.toISOString().split('T')[0];
}

// 获取今日练习统计
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 });
    }

    const today = getTodayDateString();

    // 获取今日统计
    const { data: todayStats } = await client
      .from('daily_practice_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    // 获取用户每日目标
    const { data: user } = await client
      .from('users')
      .select('daily_goal')
      .eq('id', userId)
      .single();

    // 解析今日错词
    const wrongWordIds: number[] = todayStats?.wrong_word_ids
      ? todayStats.wrong_word_ids.split(',').map((id: string) => parseInt(id)).filter((id: number) => !isNaN(id))
      : [];

    return NextResponse.json({
      success: true,
      today: {
        date: today,
        totalPracticed: todayStats?.total_practiced || 0,
        correctCount: todayStats?.correct_count || 0,
        wrongCount: todayStats?.wrong_count || 0,
        masteredCount: todayStats?.mastered_count || 0,
        wrongWordIds,
        durationSeconds: Math.min(todayStats?.duration_seconds || 0, MAX_DAILY_SECONDS),
        isSettled: todayStats?.is_settled || false,
      },
      dailyGoal: user?.daily_goal || 200,
    });

  } catch (error) {
    console.error('Get daily practice stats error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 更新今日练习统计
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      action, 
      wordId, 
      isCorrect, 
      isMastered,
      durationIncrement = 0,
    } = body;

    const today = getTodayDateString();
    const now = new Date().toISOString();

    // 获取或创建今日统计记录
    let { data: todayStats } = await client
      .from('daily_practice_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (!todayStats) {
      // 创建今日记录
      const { data: newStats, error: createError } = await client
        .from('daily_practice_stats')
        .insert({
          user_id: userId,
          date: today,
          total_practiced: 0,
          correct_count: 0,
          wrong_count: 0,
          mastered_count: 0,
          wrong_word_ids: '',
          duration_seconds: 0,
          is_settled: false,
        })
        .select()
        .single();

      if (createError) {
        console.error('Create daily stats error:', createError);
        return NextResponse.json({ error: '创建统计记录失败' }, { status: 500 });
      }
      todayStats = newStats;
    }

    // 根据操作类型更新统计
    let updateData: Record<string, unknown> = { updated_at: now };

    switch (action) {
      case 'practice':
        // 练习了一个单词
        updateData.total_practiced = (todayStats.total_practiced || 0) + 1;
        
        // 更新错词列表
        if (!isCorrect && wordId) {
          const currentWrongIds = todayStats.wrong_word_ids
            ? todayStats.wrong_word_ids.split(',').filter((id: string) => id)
            : [];
          if (!currentWrongIds.includes(String(wordId))) {
            currentWrongIds.push(String(wordId));
            updateData.wrong_word_ids = currentWrongIds.join(',');
            updateData.wrong_count = (todayStats.wrong_count || 0) + 1;
          }
        } else if (isCorrect) {
          updateData.correct_count = (todayStats.correct_count || 0) + 1;
        }
        
        // 更新练习时长
        updateData.duration_seconds = addClampedDurationSeconds(
          todayStats.duration_seconds,
          durationIncrement
        );
        break;

      case 'mastered':
        // 掌握了一个单词
        updateData.mastered_count = (todayStats.mastered_count || 0) + 1;
        break;

      case 'update_duration':
        // 仅更新时长
        updateData.duration_seconds = addClampedDurationSeconds(
          todayStats.duration_seconds,
          durationIncrement
        );
        break;

      default:
        return NextResponse.json({ error: '未知操作类型' }, { status: 400 });
    }

    // 执行更新
    const { error: updateError } = await client
      .from('daily_practice_stats')
      .update(updateData)
      .eq('id', todayStats.id);

    if (updateError) {
      console.error('Update daily stats error:', updateError);
      return NextResponse.json({ error: '更新统计失败' }, { status: 500 });
    }

    // 返回最新统计
    const { data: latestStats } = await client
      .from('daily_practice_stats')
      .select('*')
      .eq('id', todayStats.id)
      .single();

    return NextResponse.json({
      success: true,
      stats: {
        totalPracticed: latestStats?.total_practiced || 0,
        correctCount: latestStats?.correct_count || 0,
        wrongCount: latestStats?.wrong_count || 0,
        masteredCount: latestStats?.mastered_count || 0,
        wrongWordIds: latestStats?.wrong_word_ids
          ? latestStats.wrong_word_ids.split(',').map((id: string) => parseInt(id)).filter((id: number) => !isNaN(id))
          : [],
        durationSeconds: latestStats?.duration_seconds || 0,
      },
    });

  } catch (error) {
    console.error('Update daily practice stats error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
