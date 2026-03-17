import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 临时检查数据库状态
export async function GET(request: NextRequest) {
  try {
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== 'coze-admin-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = getSupabaseClient();
    
    // 查询所有用户
    const { data: users, error: usersError } = await client
      .from('users')
      .select('id, email, nickname, created_at')
      .order('id');

    // 查询用户词状态数量
    const { count: statusCount } = await client
      .from('user_word_status')
      .select('*', { count: 'exact', head: true });

    // 查询用户上下文数量
    const { count: contextCount } = await client
      .from('user_word_contexts')
      .select('*', { count: 'exact', head: true });

    // 查询来源文章数量
    const { count: sourceCount } = await client
      .from('user_text_sources')
      .select('*', { count: 'exact', head: true });

    // 查询词库数量
    const { count: wordsCount } = await client
      .from('words')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        users: users?.length || 0,
        userWordStatus: statusCount || 0,
        userWordContexts: contextCount || 0,
        userTextSources: sourceCount || 0,
        words: wordsCount || 0,
      },
      users: users || [],
      error: usersError?.message
    });

  } catch (error) {
    console.error('Check DB error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
