import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 临时管理员接口 - 获取所有用户信息
// 使用后请立即删除此文件
export async function GET(request: NextRequest) {
  try {
    // 简单的安全检查 - 需要特定的 header
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== 'coze-admin-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = getSupabaseClient();
    
    // 查询所有用户
    const { data: users, error } = await client
      .from('users')
      .select('id, email, password, nickname, created_at, last_login_at, daily_goal')
      .order('id');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 解码密码
    const usersWithDecodedPassword = users?.map(user => ({
      ...user,
      password_decoded: Buffer.from(user.password, 'base64').toString('utf-8')
    }));

    return NextResponse.json({
      success: true,
      count: usersWithDecodedPassword?.length || 0,
      users: usersWithDecodedPassword
    });

  } catch (error) {
    console.error('Admin get users error:', error);
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    );
  }
}
