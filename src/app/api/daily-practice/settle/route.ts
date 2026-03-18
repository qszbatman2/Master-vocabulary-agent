import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取今天的日期字符串 (YYYY-MM-DD) - 使用上海时区
function getTodayDateString(): string {
  const now = new Date();
  const shanghaiTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return shanghaiTime.toISOString().split('T')[0];
}

// 获取昨天的日期字符串
function getYesterdayDateString(): string {
  const now = new Date();
  const shanghaiTime = new Date(now.getTime() + 8 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000);
  return shanghaiTime.toISOString().split('T')[0];
}

/**
 * 结算 API
 * 
 * 功能：
 * 1. 标记昨天的练习记录为已结算
 * 2. 返回昨天的学习报告
 * 
 * 调用时机：
 * - 可以通过 cron job 在凌晨 00:05 调用
 * - 也可以在用户首次登录当天时调用
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    
    // 验证管理员权限
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.ADMIN_KEY || 'vocabulary-admin-2024';
    
    if (authHeader !== `Bearer ${adminKey}`) {
      // 也允许通过 cron secret 验证
      const cronSecret = request.headers.get('x-cron-secret');
      if (cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const yesterday = getYesterdayDateString();
    const today = getTodayDateString();

    // 获取昨天所有未结算的记录
    const { data: unsettledRecords, error: fetchError } = await client
      .from('daily_practice_stats')
      .select('*')
      .eq('date', yesterday)
      .eq('is_settled', false);

    if (fetchError) {
      console.error('Fetch unsettled records error:', fetchError);
      return NextResponse.json({ error: '获取记录失败' }, { status: 500 });
    }

    if (!unsettledRecords || unsettledRecords.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有需要结算的记录',
        date: yesterday,
      });
    }

    // 标记为已结算
    const { error: updateError } = await client
      .from('daily_practice_stats')
      .update({ is_settled: true })
      .eq('date', yesterday)
      .eq('is_settled', false);

    if (updateError) {
      console.error('Update settled records error:', updateError);
      return NextResponse.json({ error: '更新结算状态失败' }, { status: 500 });
    }

    // 统计昨天的总体数据
    const totalStats = unsettledRecords.reduce((acc, record) => ({
      totalPracticed: acc.totalPracticed + (record.total_practiced || 0),
      correctCount: acc.correctCount + (record.correct_count || 0),
      wrongCount: acc.wrongCount + (record.wrong_count || 0),
      masteredCount: acc.masteredCount + (record.mastered_count || 0),
      durationSeconds: acc.durationSeconds + (record.duration_seconds || 0),
    }), {
      totalPracticed: 0,
      correctCount: 0,
      wrongCount: 0,
      masteredCount: 0,
      durationSeconds: 0,
    });

    console.log(`Settled ${unsettledRecords.length} records for ${yesterday}`);

    return NextResponse.json({
      success: true,
      message: '结算完成',
      date: yesterday,
      settledCount: unsettledRecords.length,
      stats: {
        totalPracticed: totalStats.totalPracticed,
        correctCount: totalStats.correctCount,
        wrongCount: totalStats.wrongCount,
        masteredCount: totalStats.masteredCount,
        durationMinutes: Math.floor(totalStats.durationSeconds / 60),
      },
    });

  } catch (error) {
    console.error('Settle error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

/**
 * 获取历史每日统计
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 解析 token 获取用户 ID
    let userId: number | null = null;
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      userId = parseInt(decoded.split(':')[0]);
      if (isNaN(userId)) userId = null;
    } catch {
      // ignore
    }

    if (!userId) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    // 获取最近 N 天的统计
    const { data: history, error } = await client
      .from('daily_practice_stats')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(days);

    if (error) {
      console.error('Fetch history error:', error);
      return NextResponse.json({ error: '获取历史记录失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      history: (history || []).map(record => ({
        date: record.date,
        totalPracticed: record.total_practiced,
        correctCount: record.correct_count,
        wrongCount: record.wrong_count,
        masteredCount: record.mastered_count,
        wrongWordIds: record.wrong_word_ids
          ? record.wrong_word_ids.split(',').map((id: string) => parseInt(id)).filter((id: number) => !isNaN(id))
          : [],
        durationMinutes: Math.floor((record.duration_seconds || 0) / 60),
        isSettled: record.is_settled,
      })),
    });

  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
