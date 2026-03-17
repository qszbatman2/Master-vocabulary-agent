import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 删除重复单词 - 保留每个词的最小 ID
export async function POST(request: NextRequest) {
  try {
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== 'coze-admin-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = getSupabaseClient();

    // 1. 获取所有单词
    const { data: allWords, error: fetchError } = await client
      .from('words')
      .select('id, word')
      .order('id');

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // 2. 找出重复的词，保留最小 ID
    const wordToKeep: Map<string, number> = new Map();
    const idsToDelete: number[] = [];

    allWords?.forEach(w => {
      const lowerWord = w.word.toLowerCase();
      if (!wordToKeep.has(lowerWord)) {
        // 第一次遇到这个词，保留
        wordToKeep.set(lowerWord, w.id);
      } else {
        // 重复的词，标记删除
        idsToDelete.push(w.id);
      }
    });

    if (idsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有重复数据需要删除',
        beforeCount: allWords?.length || 0,
        afterCount: allWords?.length || 0,
        deletedCount: 0,
      });
    }

    // 3. 先删除关联的 user_word_status 记录
    const { error: statusError } = await client
      .from('user_word_status')
      .delete()
      .in('word_id', idsToDelete);

    if (statusError) {
      console.error('Delete user_word_status error:', statusError);
    }

    // 4. 删除关联的 user_word_contexts 记录
    const { error: contextError } = await client
      .from('user_word_contexts')
      .delete()
      .in('word_id', idsToDelete);

    if (contextError) {
      console.error('Delete user_word_contexts error:', contextError);
    }

    // 5. 删除重复的单词
    const { error: deleteError } = await client
      .from('words')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // 6. 获取删除后的数量
    const { count: afterCount } = await client
      .from('words')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      message: `成功删除 ${idsToDelete.length} 个重复单词`,
      beforeCount: allWords?.length || 0,
      afterCount: afterCount || 0,
      deletedCount: idsToDelete.length,
      deletedIds: idsToDelete.slice(0, 100), // 只返回前100个
    });

  } catch (error) {
    console.error('Deduplicate error:', error);
    return NextResponse.json(
      { error: 'Failed to deduplicate' },
      { status: 500 }
    );
  }
}

// GET - 预览将要删除的数据
export async function GET(request: NextRequest) {
  try {
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== 'coze-admin-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = getSupabaseClient();

    // 获取所有单词
    const { data: allWords, count: totalCount } = await client
      .from('words')
      .select('id, word', { count: 'exact' })
      .order('id');

    // 找出重复的词
    const wordToKeep: Map<string, number> = new Map();
    const idsToDelete: number[] = [];
    const duplicates: Array<{ word: string; keepId: number; deleteIds: number[] }> = [];

    allWords?.forEach(w => {
      const lowerWord = w.word.toLowerCase();
      if (!wordToKeep.has(lowerWord)) {
        wordToKeep.set(lowerWord, w.id);
      } else {
        idsToDelete.push(w.id);
        // 记录重复信息
        const existing = duplicates.find(d => d.word === lowerWord);
        if (existing) {
          existing.deleteIds.push(w.id);
        } else {
          duplicates.push({
            word: lowerWord,
            keepId: wordToKeep.get(lowerWord)!,
            deleteIds: [w.id],
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalWords: totalCount,
        uniqueWords: wordToKeep.size,
        willDelete: idsToDelete.length,
        afterDelete: wordToKeep.size,
      },
      sampleDuplicates: duplicates.slice(0, 20),
    });

  } catch (error) {
    console.error('Preview deduplicate error:', error);
    return NextResponse.json(
      { error: 'Failed to preview' },
      { status: 500 }
    );
  }
}
