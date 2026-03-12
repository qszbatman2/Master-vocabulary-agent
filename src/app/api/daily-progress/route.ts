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

// 获取今天的日期字符串 (YYYY-MM-DD)
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// GET: 获取今日学习进度
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

    // 获取用户信息（包括每日目标）
    const { data: user, error: userError } = await client
      .from('users')
      .select('daily_goal')
      .eq('id', userId)
      .single();

    if (userError) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 获取今日有效答对的单词数
    const { count: todayCorrectCount, error: countError } = await client
      .from('user_word_status')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('last_correct_date', today);

    if (countError) {
      console.error('Count error:', countError);
    }

    // 获取今日练习总数
    const { data: todayStats } = await client
      .from('user_word_status')
      .select('total_practice_count, correct_count, wrong_count')
      .eq('user_id', userId)
      .gte('last_practiced_at', `${today}T00:00:00`);

    // 计算今日总练习数（需要更精确的统计）
    // 由于 total_practice_count 是累计值，我们需要另一种方式
    // 简化：使用今日有效答对数作为主要指标

    const dailyGoal = user?.daily_goal || 200;
    const completed = todayCorrectCount || 0;
    const progress = Math.min(100, Math.round((completed / dailyGoal) * 100));

    return NextResponse.json({
      dailyGoal,
      completed,
      progress,
      isCompleted: completed >= dailyGoal,
    });
  } catch (error) {
    console.error('Error fetching daily progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily progress' },
      { status: 500 }
    );
  }
}

// POST: 更新每日目标
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
    const { dailyGoal } = body;

    if (!dailyGoal || dailyGoal < 1 || dailyGoal > 1000) {
      return NextResponse.json({ error: '目标数量需在 1-1000 之间' }, { status: 400 });
    }

    const { error: updateError } = await client
      .from('users')
      .update({ daily_goal: dailyGoal })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ error: '更新失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, dailyGoal });
  } catch (error) {
    console.error('Error updating daily goal:', error);
    return NextResponse.json(
      { error: 'Failed to update daily goal' },
      { status: 500 }
    );
  }
}
