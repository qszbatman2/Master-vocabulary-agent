import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 临时诊断接口 - 检查词库重复数据
export async function GET(request: NextRequest) {
  try {
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== 'coze-admin-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = getSupabaseClient();

    // 1. 获取总词数
    const { count: totalWords } = await client
      .from('words')
      .select('*', { count: 'exact', head: true });

    // 2. 查找重复的词（按 word 字段）
    const { data: allWords } = await client
      .from('words')
      .select('id, word, meaning')
      .order('word');

    // 3. 统计重复
    const wordCount: Record<string, number[]> = {};
    allWords?.forEach(w => {
      const lowerWord = w.word.toLowerCase();
      if (!wordCount[lowerWord]) {
        wordCount[lowerWord] = [];
      }
      wordCount[lowerWord].push(w.id);
    });

    // 4. 找出重复的词
    const duplicates: Array<{ word: string; ids: number[]; count: number }> = [];
    Object.entries(wordCount).forEach(([word, ids]) => {
      if (ids.length > 1) {
        duplicates.push({ word, ids, count: ids.length });
      }
    });

    // 按重复次数排序
    duplicates.sort((a, b) => b.count - a.count);

    // 5. 统计
    const totalDuplicates = duplicates.length;
    const totalDuplicateRecords = duplicates.reduce((sum, d) => sum + d.count, 0);
    const recordsToRemove = totalDuplicateRecords - totalDuplicates;

    return NextResponse.json({
      success: true,
      summary: {
        totalWords,
        uniqueWords: Object.keys(wordCount).length,
        duplicateWordCount: totalDuplicates,
        totalDuplicateRecords,
        recordsToRemove,
      },
      topDuplicates: duplicates.slice(0, 50), // 显示前50个重复最多的词
      allDuplicates: duplicates,
    });

  } catch (error) {
    console.error('Check duplicates error:', error);
    return NextResponse.json(
      { error: 'Failed to check duplicates' },
      { status: 500 }
    );
  }
}
