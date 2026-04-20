import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getTodayShanghaiDateString } from '@/lib/shanghai-date';

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

    const today = getTodayShanghaiDateString();

    // 获取用户信息（包括每日目标）
    const { data: user, error: userError } = await client
      .from('users')
      .select('daily_goal')
      .eq('id', userId)
      .single();

    if (userError) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 历史物理列名仍为 correct_count，但业务语义统一为“去重后的有效答对词数”。
    const { data: todayStats } = await client
      .from('daily_practice_stats')
      .select('correct_count,total_practiced')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    const dailyGoal = user?.daily_goal || 200;
    const effectiveCompletedCount = todayStats?.correct_count || 0;
    const hasStudyActivity = (todayStats?.total_practiced || 0) > 0;
    const progress = Math.min(100, Math.round((effectiveCompletedCount / dailyGoal) * 100));

    return NextResponse.json({
      dailyGoal,
      effectiveCompletedCount,
      completed: effectiveCompletedCount,
      progress,
      hasStudyActivity,
      isCompleted: effectiveCompletedCount >= dailyGoal,
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
