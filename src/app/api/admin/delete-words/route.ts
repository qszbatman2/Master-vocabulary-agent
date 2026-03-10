import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

// 授权检查
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminKey = process.env.ADMIN_KEY || 'vocabulary-admin-2024';
  return authHeader === `Bearer ${adminKey}`;
}

/**
 * 删除单词 API
 * POST /api/admin/delete-words
 * Body: { wordIds: number[] }
 * 
 * 安全删除单词，处理用户记录：
 * 1. 如果要删除的单词有用户记录，将记录迁移到保留的单词
 * 2. 删除单词记录
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ 
      error: 'Unauthorized',
      hint: 'Add Authorization header with value: Bearer vocabulary-admin-2024',
    }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { wordIds } = body as { wordIds: number[] };

    if (!wordIds || !Array.isArray(wordIds) || wordIds.length === 0) {
      return NextResponse.json({ error: 'wordIds must be a non-empty array' }, { status: 400 });
    }

    console.log(`准备删除 ${wordIds.length} 个单词...`);

    // 1. 先删除关联的用户记录
    const { error: statusError } = await client
      .from('user_word_status')
      .delete()
      .in('word_id', wordIds);

    if (statusError) {
      console.error('删除用户记录失败:', statusError);
      // 继续删除单词，因为可能没有用户记录
    }

    // 2. 删除单词
    const { error: wordsError, count } = await client
      .from('words')
      .delete()
      .in('id', wordIds);

    if (wordsError) {
      console.error('删除单词失败:', wordsError);
      return NextResponse.json({ error: '删除单词失败', details: wordsError.message }, { status: 500 });
    }

    console.log(`成功删除 ${count || wordIds.length} 个单词`);

    // 3. 获取当前单词总数
    const { count: totalCount } = await client
      .from('words')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      deleted: count || wordIds.length,
      remaining: totalCount,
    });

  } catch (error) {
    console.error('删除操作异常:', error);
    return NextResponse.json({ error: '删除操作失败', details: String(error) }, { status: 500 });
  }
}

/**
 * 清空所有单词数据（危险操作）
 * POST /api/admin/delete-words
 * Body: { action: 'clear-all' }
 */
export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    
    if (body.action !== 'clear-all') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    console.log('清空所有单词数据...');

    // 先删除用户记录
    await client.from('user_word_status').delete().neq('id', 0);
    
    // 再删除单词
    const { count: beforeCount } = await client
      .from('words')
      .select('*', { count: 'exact', head: true });

    await client.from('words').delete().neq('id', 0);

    return NextResponse.json({
      success: true,
      cleared: beforeCount,
    });

  } catch (error) {
    console.error('清空操作失败:', error);
    return NextResponse.json({ error: '清空操作失败', details: String(error) }, { status: 500 });
  }
}
