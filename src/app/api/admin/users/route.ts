import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getShanghaiDateStartIso, getShanghaiDateWithOffset, getTodayShanghaiDateString } from '@/lib/shanghai-date';

const ADMIN_TOKEN = process.env.ADMIN_KEY || 'vocabulary-admin-2024';

export async function GET(request: NextRequest) {
  // 授权检查
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (token !== ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = getSupabaseClient();

  try {
    // 获取用户总数
    const { count: totalUsers } = await client
      .from('users')
      .select('*', { count: 'exact', head: true });

    // 获取用户列表（最近注册的）
    const { data: recentUsers } = await client
      .from('users')
      .select('id, email, nickname, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    // 获取有学习记录的用户数
    const { data: usersWithRecords } = await client
      .from('user_word_status')
      .select('user_id');

    const uniqueUserIds = new Set(usersWithRecords?.map(r => r.user_id) || []);

    // 获取总学习记录数
    const { count: totalRecords } = await client
      .from('user_word_status')
      .select('*', { count: 'exact', head: true });

    // 获取已掌握单词数
    const { count: masteredWords } = await client
      .from('user_word_status')
      .select('*', { count: 'exact', head: true })
      .eq('is_mastered', true);

    // 获取今日活跃用户
    const today = getTodayShanghaiDateString();
    const { data: todayActive } = await client
      .from('user_word_status')
      .select('user_id')
      .gte('updated_at', getShanghaiDateStartIso(today));

    const todayActiveUsers = new Set(todayActive?.map(r => r.user_id) || []);

    // 获取最近7天活跃用户
    const sevenDaysAgo = getShanghaiDateWithOffset(-7);
    const { data: weekActive } = await client
      .from('user_word_status')
      .select('user_id')
      .gte('updated_at', getShanghaiDateStartIso(sevenDaysAgo));

    const weekActiveUsers = new Set(weekActive?.map(r => r.user_id) || []);

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers || 0,
        usersWithRecords: uniqueUserIds.size,
        totalRecords: totalRecords || 0,
        masteredWords: masteredWords || 0,
        todayActiveUsers: todayActiveUsers.size,
        weekActiveUsers: weekActiveUsers.size,
      },
      recentUsers: recentUsers || [],
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
