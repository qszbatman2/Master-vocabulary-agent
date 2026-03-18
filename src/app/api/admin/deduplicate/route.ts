import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 删除重复单词 - 保留每个词的最小 ID
export async function POST(request: NextRequest) {
  try {
    const adminKey = request.headers.get('x-admin-key');
    const expectedKey = process.env.ADMIN_KEY || 'vocabulary-admin-2024';
    if (adminKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = getSupabaseClient();

    // 1. 分批获取所有单词（Supabase 默认限制 1000 行）
    const allWords: Array<{ id: number; word: string }> = [];
    let page = 0;
    const PAGE_SIZE = 1000;
    
    while (true) {
      const { data, error: fetchError } = await client
        .from('words')
        .select('id, word')
        .order('id')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 500 });
      }

      if (!data || data.length === 0) {
        break;
      }

      allWords.push(...data);
      
      if (data.length < PAGE_SIZE) {
        break;
      }
      page++;
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

    // 3. 分批删除关联的 user_word_status 记录
    const BATCH_SIZE = 500;
    let statusDeleted = 0;
    for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
      const batch = idsToDelete.slice(i, i + BATCH_SIZE);
      const { error: statusError, count } = await client
        .from('user_word_status')
        .delete()
        .in('word_id', batch);
      if (statusError) {
        console.error('Delete user_word_status error:', statusError);
      }
      statusDeleted += count || 0;
    }

    // 4. 分批删除关联的 user_word_contexts 记录
    let contextDeleted = 0;
    for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
      const batch = idsToDelete.slice(i, i + BATCH_SIZE);
      const { error: contextError, count } = await client
        .from('user_word_contexts')
        .delete()
        .in('word_id', batch);
      if (contextError) {
        console.error('Delete user_word_contexts error:', contextError);
      }
      contextDeleted += count || 0;
    }

    // 5. 分批删除重复的单词
    let wordsDeleted = 0;
    for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
      const batch = idsToDelete.slice(i, i + BATCH_SIZE);
      const { error: deleteError, count } = await client
        .from('words')
        .delete()
        .in('id', batch);
      if (deleteError) {
        console.error('Delete words error:', deleteError);
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }
      wordsDeleted += count || 0;
    }

    // 6. 获取删除后的数量
    const { count: afterCount } = await client
      .from('words')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      message: `成功删除 ${wordsDeleted} 个重复单词`,
      beforeCount: allWords?.length || 0,
      afterCount: afterCount || 0,
      deletedCount: wordsDeleted,
      statusDeleted,
      contextDeleted,
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

    // 分批获取所有单词
    const allWords: Array<{ id: number; word: string }> = [];
    let page = 0;
    const PAGE_SIZE = 1000;
    
    while (true) {
      const { data, error: fetchError } = await client
        .from('words')
        .select('id, word')
        .order('id')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 500 });
      }

      if (!data || data.length === 0) {
        break;
      }

      allWords.push(...data);
      
      if (data.length < PAGE_SIZE) {
        break;
      }
      page++;
    }

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
        totalWords: allWords.length,
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
