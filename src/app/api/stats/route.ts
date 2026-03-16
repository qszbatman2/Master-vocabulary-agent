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
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 });
    }

    // 获取今天的日期字符串（上海时区）
    const now = new Date();
    const shanghaiTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const today = shanghaiTime.toISOString().split('T')[0];
    const todayStart = `${today}T00:00:00`;

    // 获取用户所有单词状态
    const { data: userStatus, error: statusError } = await client
      .from('user_word_status')
      .select('*')
      .eq('user_id', userId);

    if (statusError) {
      return NextResponse.json({ error: statusError.message }, { status: 500 });
    }

    // 获取总单词数
    const { count: totalWords, error: countError } = await client
      .from('words')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    // 计算统计数据
    const statusList = userStatus || [];
    
    // 累计掌握的单词数
    const masteredCount = statusList.filter(s => s.is_mastered).length;
    
    // 复习中的单词（有过错误但未掌握）
    const reviewingCount = statusList.filter(s => !s.is_mastered && s.wrong_count > 0).length;
    
    // 剩余新词（从未练习过的）
    const practicedWordIds = new Set(statusList.map(s => s.word_id));
    const newWordsCount = (totalWords || 0) - practicedWordIds.size;

    // 今日统计
    const todayStatus = statusList.filter(s => {
      const lastPracticed = s.last_practiced_at;
      return lastPracticed && lastPracticed >= todayStart;
    });
    
    const todayPracticedCount = todayStatus.length;
    const todayMasteredCount = todayStatus.filter(s => s.is_mastered).length;

    return NextResponse.json({
      today: {
        practicedCount: todayPracticedCount,      // 今日已背单词数
        masteredCount: todayMasteredCount,        // 今日掌握单词数
      },
      total: {
        masteredCount,                            // 累计掌握
        reviewingCount,                           // 复习中
        newWordsCount,                            // 剩余新词
        totalWords: totalWords || 0,              // 总单词数
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
